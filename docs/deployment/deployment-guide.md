# Deployment Guide

## GitHub Variable/Secret Setup

> This step requires admin permissions on the GitHub repository.

### How to Add Variables/Secrets

1. From the GitHub repository page, navigate to **Settings > Secrets and variables > Actions**.
2. Select the **Secrets** or **Variables** tab based on the type of value you are adding. Note that values added to **Variables** are not secured.
3. Click **New repository secret/variable**
4. Enter the **Name** and **Value** fields for your [required variable/secret](#required-variablessecrets).
5. Click **Add secret/variable**

### Required Variables/Secrets

Every variable/secret must be prefixed with the name of the Environment you are deploying to (casing is ignored). This can be `develop`, `uat`, or `production`.

The following table lists the variables/secrets you should add if you are deploying to the `production` environment:

| Name                             | Description                                                                                                                            | Is Secret | Note                |
| -------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- | --------- | ------------------- |
| PRODUCTION_TWILIO_ACCOUNT_SID    | The Twilio Account SID. Found in the [Twilio Console](https://console.twilio.com)                                                      | No        | Starts with `AC...` |
| PRODUCTION_TWILIO_API_KEY        | The SID of a Twilio API Key. Can be created and viewed in [Api Keys](https://console.twilio.com/us1/account/keys-credentials/api-keys) | No        | Starts with `SK...` |
| **PRODUCTION_TWILIO_API_SECRET** | The Secret Value of the Api Key specified in PRODUCTION_TWILIO_API_KEY. Can only be viewed on creation of the Api Key.                 | **Yes**   |                     |

If you are deploying to a different Environment, replace `PRODUCTION` with the name of the Environment. E.g. to deploy to the UAT Ebvironment you must set the `UAT_TWILIO_ACCOUNT_SID` variable (and do the same for the rest of the table).

## Triggering Deployment

From the GitHub repository page, navigate to the **Actions** page. On the left you will see a list of **workflows**. For a first-time deployment, trigger the workflows in the following order:

### 1. Build Code

1. Select the **Build Code Components** Workflow
2. Click **Run workflow** and wait for completion

### 2. Deploy Solution

1. Select the **Deploy Solution** Workflow
2. Click **Run workflow**
3. Select the Environment you want to deploy to (Develop/UAT/Production)
4. Select the code components to also deploy. (For a first-time deploy select **all**)
5. Run and wait for completion
