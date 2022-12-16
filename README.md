# acs-demo

Simple demo on Azure Communication Services (ACS)

## Description

This project was created based on my learning from ACS I'm working on.  I'll continue to add things as learn them.

### Requirements

- **Azure Subscription**
  - An Azure Communications Services resource created
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
