import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { CallClient } from "@azure/communication-calling";

const config = require("./config.json");
const displayNameInput = document.getElementById('display-name-input');
const acsIdentityInput = document.getElementById('acs-identity-input');
const createCallAgentButton = document.getElementById('create-call-agent-button');
const meetingLinkInput = document.getElementById('teams-link-input');
const joinMeetingButton = document.getElementById('join-meeting-button');
const callUserIdInput = document.getElementById('call-user-id-input');
const callUserButton = document.getElementById('call-user-button');
const hangUpButton = document.getElementById('hang-up-button');
const muteButton = document.getElementById('mute-button');
const unmuteButton = document.getElementById('unmute-button');

let callAgent;
let activeCall;

async function init() {
    displayNameInput.value = "Meeting joiner!";
    acsIdentityInput.value = "";
    meetingLinkInput.value = "";
    callUserIdInput.value = "8:echo123";
}

createCallAgentButton.onclick = async () => {
    try {
        let callClient = new CallClient();

        var tokenCredential = await getTokenCredential();
        callAgent = await callClient.createCallAgent(tokenCredential, { displayName: displayNameInput.value });

        createCallAgentButton.innerText = "Call Agent Created";
        createCallAgentButton.disabled = true;
        updateUX();
    }
    catch (error) {
        console.error(error);
    }
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
    var callee = { id: callUserIdInput.value };

    try {
        activeCall = callAgent.startCall([callee],null);
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

hangUpButton.onclick = async () => {
    await activeCall.hangUp();
};

muteButton.onclick = async () => {
    await activeCall.mute(); 
};

unmuteButton.onclick = async () => {
    await activeCall.unmute();
};

function subscribeToCallEvents(call) {
    call.on('stateChanged', () => {
        console.log(`Call state changed. \nId: ${call.id} \nState: ${call.state}`);
        if (call.state == "Connected") {
            call.info.getServerCallId().then(result => console.log(`Server call id: ${result}`));
        }
        if (call.state == "Disconnected") {
            console.log(`Call end reason: (${activeCall.callEndReason.code} ${activeCall.callEndReason.subCode})`);
            activeCall = null;
        }
        updateUX();
    });

    call.on('isMutedChanged', () => {
        console.log(`isMutedChanged: ${call.isMuted}`);
        updateUX();
    });
}

function updateUX() {
    if(activeCall && callAgent){
        joinMeetingButton.disabled = true;
        callUserButton.disabled = true;
        hangUpButton.disabled = false;

        if (activeCall.isMuted) {
            muteButton.disabled = true;
            unmuteButton.disabled = false;
        } else {
            muteButton.disabled = false;
            unmuteButton.disabled = true;
        }
    }
    else if (callAgent){
        joinMeetingButton.disabled = false;
        callUserButton.disabled = false;
        hangUpButton.disabled = true;
        muteButton.disabled = true;
        unmuteButton.disabled = true;
    }
    else {
        //
    }
}

init();