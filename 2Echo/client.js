import { AzureCommunicationTokenCredential } from '@azure/communication-common';
import { CommunicationIdentityClient } from "@azure/communication-identity";
import { CallClient } from "@azure/communication-calling";

const config = require("./config.json");
const displayNameInput = document.getElementById('display-name-input');
const acsIdentityInput = document.getElementById('acs-identity-input');
const createCallAgentButton = document.getElementById('create-call-agent-button');
const callUserIdInput = document.getElementById('call-user-id-input');
const callUserButton = document.getElementById('call-user-button');
const hangUpButton = document.getElementById('hang-up-button');

let callAgent;
let activeCall;

async function init() {
    displayNameInput.value = "Caller Display Name";
    acsIdentityInput.value = "";
    callUserIdInput.value = "8:echo123";
}

createCallAgentButton.onclick = async () => {
    try {
        let callClient = new CallClient();

        var tokenCredential = await getTokenCredential();
        callAgent = await callClient.createCallAgent(tokenCredential, { displayName: displayNameInput.value });

        createCallAgentButton.innerText = "Call Agent Created";
        createCallAgentButton.disabled = true;
        callUserButton.disabled = false;
    }
    catch (error) {
        console.error(error);
    }
};

async function getTokenCredential() {
    // Client apps should not have access to the resource keys / connection string!
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
        callUserButton.disabled = true;
        hangUpButton.disabled = false;
    
        activeCall.on('stateChanged', () => {
            console.log(`Call state changed. \nId: ${activeCall.id} \nState: ${activeCall.state}`);
            if (activeCall.state == "Disconnected") {
                console.log(`Call end reason: (${activeCall.callEndReason.code} ${activeCall.callEndReason.subCode})`);
            }
        });    
    }
    catch (error) {
        console.error(error);
        return;
    }
};

hangUpButton.onclick = async () => {
    await activeCall.hangUp();
    callUserButton.disabled = false;
    hangUpButton.disabled = true;
};

init();