# acs-demo

Simple demo on Azure Communication Services (ACS)

## Description

This project was created to get a basic understanding of ACS and how you could quickly spin up a working app using the [Azure Communication Services Calling SDK for Javascript](https://learn.microsoft.com/en-us/javascript/api/overview/azure/communication?view=azure-node-latest).  I would consider this a work in progress...:smile:

## Requirements

- **Azure Subscription**
  - An Azure Communications Services resource created
- [Node.js](https://nodejs.org/en/) to install and manage dependencies like Azure Communication Services SDKs and webpack
- **This repo cloned in your own GitHub repo**

## How to run locally

Follow these steps for how to run this app locally

1. `git clone <repository url>`
2. `cd <local_repository>`
3. Create a new config.json file and copy this into the contents of that file

    ``` json
    {
        "connectionString": "",
        "endpointUrl": ""
    }
    ```

4. Update the connectionString and endpointUrl with the info from your ACS resource in the Azure portal
5. Delete the `node_modules` folder and any 'lock' files such as `yarn.lock` or `package-lock.json` if present
6. `npm install`
7. `npm start`

### Other Resources

- Main Azure Communication Services doc page: [Azure Communication Services](https://learn.microsoft.com/en-us/azure/communication-services/)
- Azure Communication Services UI Library: [ACS UI Library](https://azure.github.io/communication-ui-library/?path=/docs/overview--page)
- Client Server Architecture:  [Client Server Architecture](https://learn.microsoft.com/en-us/azure/communication-services/concepts/client-and-server-architecture)
