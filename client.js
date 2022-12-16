import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { CallClient } from "@azure/communication-calling";
import { LocalVideoStream } from "@azure/communication-calling";
import { VideoStreamRenderer } from "@azure/communication-calling";

const config = require("./config.json");
const displayNameInput = document.getElementById('display-name-input');
const acsIdentityInput = document.getElementById('acs-identity-input');
const createCallAgentButton = document.getElementById('create-call-agent-button');
const meetingLinkInput = document.getElementById('teams-link-input');
const joinMeetingButton = document.getElementById('join-meeting-button');
const callUserIdInput = document.getElementById('call-user-id-input');
const callUserButton = document.getElementById('call-user-button');
const acceptCallButton = document.getElementById('accept-call-button');
const rejectCallButton = document.getElementById('reject-call-button');
const muteButton = document.getElementById('mute-button');
const unmuteButton = document.getElementById('unmute-button');
const startVideoButton = document.getElementById('start-video-button');
const stopVideoButton = document.getElementById('stop-video-button');
const videoPreviewElement = document.getElementById('video-preview');
const remoteVideoElement = document.getElementById('remote-video');
const hangUpButton = document.getElementById('hang-up-button');
const getParticipantsButton = document.getElementById('get-participants-button');

let callClient;
let callAgent;
let activeCall;
let incomingCall;
let localVideoStreamRenderer;

async function init() {
    displayNameInput.value = "Caller Display Name";
    acsIdentityInput.value = "";
    meetingLinkInput.value = "";
    callUserIdInput.value = "8:echo123";
}

createCallAgentButton.onclick = async () => {
    try {
        callClient = new CallClient();
        var tokenCredential = await getTokenCredential();
        callAgent = await callClient.createCallAgent(tokenCredential, { displayName: displayNameInput.value });

        createCallAgentButton.innerText = "Call Agent Created";
        createCallAgentButton.disabled = true;
        updateUX();
    }
    catch (error) {
        console.error(error);
    }

    // Listen for an incoming call to accept.
    callAgent.on('incomingCall', async (args) => {
        try {
            incomingCall = args.incomingCall;
            console.log(`Incoming call id: ${incomingCall.id}`);
            console.log(`Display name: ${incomingCall.callerInfo.displayName}`);
            console.log(incomingCall.callerInfo.identifier);
            incomingCall.on('callEnded', args => {
                console.log(`Incoming call end reason: (${incomingCall.callEndReason.code} ${incomingCall.callEndReason.subCode})`);
                incomingCall = null;
                updateUX();
            });

            updateUX();
        } catch (error) {
            console.error(error);
        }
    });
};

async function getTokenCredential() {
    // Client apps should not have access to the resource keys!
    let identityClient = new CommunicationIdentityClient(config.connectionString);

    // Reuse existing identifier or create new
    var acsCaller;
    if (acsIdentityInput.value) {
        acsCaller = { communicationUserId: acsIdentityInput.value }
    }
    else {
        acsCaller = await identityClient.createUser();
        acsIdentityInput.value = acsCaller.communicationUserId;
    }

    let tokenResponse = await identityClient.getToken(acsCaller, ["voip", "chat"]);
    const { token, expiresOn } = tokenResponse;
    console.log(`Token expires ${expiresOn}\n${token}`);

    return new AzureCommunicationTokenCredential(token);
}

callUserButton.onclick = () => {
    var callee;

    if (callUserIdInput.value.startsWith("8:acs:")) {
        callee = { communicationUserId: callUserIdInput.value };
    }
    else { //8:echo123
        callee = { id: callUserIdInput.value }
    }

    try {
        activeCall = callAgent.startCall([callee], null);
        subscribeToCallEvents(activeCall);
    }
    catch (error) {
        console.error(error);
    }
};

joinMeetingButton.onclick = () => {
    try {
        let audioOptions = {muted:true};
        activeCall = callAgent.join({ meetingLink: meetingLinkInput.value }, {audioOptions});
        subscribeToCallEvents(activeCall);
    }
    catch (error) {
        console.error(error);
    }
};

acceptCallButton.onclick = async () => {
    activeCall = await incomingCall.accept();
    subscribeToCallEvents(activeCall);
};

rejectCallButton.onclick = () => {
    console.log(`Rejected call ${incomingCall.id}`);
    incomingCall.reject();
};

hangUpButton.onclick = async () => {
    await activeCall.hangUp();
};

muteButton.onclick = async () => {
    await activeCall.mute(); 
};

unmuteButton.onclick = async () => {
    await activeCall.unmute();
};

getParticipantsButton.onclick = async () => {
    try {
        let remoteParticipants = await activeCall.remoteParticipants;
        for await (var participant of remoteParticipants) {
            console.log(participant);
        }
    }
    catch (error) {
        console.error(error);
    }
};

function updateUX() {
    if(activeCall && callAgent){
        joinMeetingButton.disabled = true;
        callUserButton.disabled = true;
        hangUpButton.disabled = false;

        acceptCallButton.disabled = true;
        rejectCallButton.disabled = true;

        startVideoButton.disabled = false;
        getParticipantsButton.disabled = false;
    
        if (activeCall.isMuted) {
            muteButton.disabled = true;
            unmuteButton.disabled = false;
        } else {
            muteButton.disabled = false;
            unmuteButton.disabled = true;
        }
    }
    else if (incomingCall) {
        callUserButton.disabled = true;
        acceptCallButton.disabled = false;
        rejectCallButton.disabled = false;
    }
    else if (callAgent){
        joinMeetingButton.disabled = false;
        callUserButton.disabled = false;
        hangUpButton.disabled = true;
        muteButton.disabled = true;
        unmuteButton.disabled = true;

        acceptCallButton.disabled = true;
        rejectCallButton.disabled = true;

        startVideoButton.disabled = true;
        stopVideoButton.disabled = true;
        getParticipantsButton.disabled = true;
        if (videoPreviewElement.firstChild) {
            videoPreviewElement.removeChild(videoPreviewElement.firstChild);
        }    
    }
    else {
        //
    }
}

function subscribeToCallEvents(call) {
    call.on('stateChanged', () => {
        console.log(`Call state changed. \nId: ${call.id} \nState: ${call.state}`);
        if (call.state == "Connected") {
            call.info.getServerCallId().then(result => console.log(`Server call id: ${result}`));
        }
        if (call.state == "Disconnected") {
            console.log(`Call end reason: (${call.callEndReason.code} ${call.callEndReason.subCode})`);
            activeCall = null;
        }
        updateUX();
    });

    call.on('isMutedChanged', () => {
        console.log(`isMutedChanged: ${call.isMuted}`);
        updateUX();
    });

    // Inspect the call's current remote participants and subscribe to them.
    call.remoteParticipants.forEach(remoteParticipant => {
        subscribeToRemoteParticipant(remoteParticipant);
    });

    call.on('remoteParticipantsUpdated', async (e) => {
        console.log("Remote participants added:");
        e.added.forEach(remoteParticipant => {
            console.log(remoteParticipant);
            subscribeToRemoteParticipant(remoteParticipant)
        });
        console.log("Remote participants removed:");
        e.removed.forEach(remoteParticipant => {
            console.log(remoteParticipant);
        })
    });
}


/**
 * Subscribe to a remote participant obj.
 * Listen for property changes and collection udpates.
 */
async function subscribeToRemoteParticipant(remoteParticipant){
    try {
        console.log(`Remote participant state: ${remoteParticipant.state}`);
        remoteParticipant.on('stateChanged', () => {
            console.log(`Remote participant state changed: ${remoteParticipant.state}`);
        });

        remoteParticipant.videoStreams.forEach(remoteVideoStream => {
            subscribeToRemoteVideoStream(remoteVideoStream)
        });

        remoteParticipant.on('videoStreamsUpdated', e => {
            console.log(`Participant video streams updated. ${e}`);
            e.added.forEach(remoteVideoStream => {
                console.log(`Stream added. ${remoteVideoStream.id}`);
                subscribeToRemoteVideoStream(remoteVideoStream)
            });
            e.removed.forEach(remoteVideoStream => {
                console.log(`Stream removed. ${remoteVideoStream.id}`);
            })
        });
    } catch (error) {
        console.error(error);
    }
}

/**
 * Subscribe to a remote participant's remote video stream obj.
 * You have to subscribe to the 'isAvailableChanged' event to render the remoteVideoStream. If the 'isAvailable' property
 * changes to 'true', a remote participant is sending a stream. Whenever availability of a remote stream changes
 * you can choose to destroy the whole 'Renderer', a specific 'RendererView' or keep them, but this will result in displaying blank video frame.
 */
async function subscribeToRemoteVideoStream(remoteVideoStream) {
    let renderer = new VideoStreamRenderer(remoteVideoStream);
    let view;

    const createView = async () => {
        // Create a renderer view for the remote video stream.
        view = await renderer.createView();
        // Attach the renderer view to the UI
        remoteVideoElement.appendChild(view.target);
        //videoPreviewElement.appendChild(view.target);
    }

    // Remote participant has video on initially.
    if (remoteVideoStream.isAvailable) {
        console.log('video isAvailable 1000');
        try {
            await createView();
        } catch (error)
        {
            console.error(error);
        }
    }

    // Remote participant has switched video on/off
    remoteVideoStream.on('isAvailableChanged', async () => {
        console.log('video isAvailableChanged 1009');
        try {
            if (remoteVideoStream.isAvailable) {
                await createView();
            } else {
                view.dispose();
            }
        } catch (error) {
            console.error(error);
        }
    });
}

startVideoButton.onclick = async () => {
    try {
        const deviceManager = await callClient.getDeviceManager();
        const localCameras = await deviceManager.getCameras();
        const camera = localCameras[0];
        const localVideoStream = new LocalVideoStream(camera);
        await activeCall.startVideo(localVideoStream);

        //preview
        console.log("local stream renderer");
        localVideoStreamRenderer = new VideoStreamRenderer(localVideoStream);
        const view = await localVideoStreamRenderer.createView();
        videoPreviewElement.appendChild(view.target);  

        stopVideoButton.disabled = false;
        startVideoButton.disabled = true;    
    } catch (error) {
        console.error(error);
    }
};

stopVideoButton.onclick = async () => {
    try {
        await activeCall.stopVideo(activeCall.localVideoStreams[0]);
        videoPreviewElement.removeChild(videoPreviewElement.firstChild);
        localVideoStreamRenderer.dispose();

        stopVideoButton.disabled = true;
        startVideoButton.disabled = false;
    } catch (error) {
        console.error(error);
    }
};

init();