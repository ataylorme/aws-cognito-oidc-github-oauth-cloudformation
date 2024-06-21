import {APIGatewayEvent, APIGatewayProxyResult} from 'aws-lambda'
import fetch from 'node-fetch'
import {parse as querystringParse} from 'querystring'

type GitHubTokenProxyEventType = {
  code: string
  client_id: string
  client_secret: string
}

type RequiredParams = keyof GitHubTokenProxyEventType

type tokenResponseType = {
  access_token: string
  token_type: string
  scope: string
}

function checkParams(event: GitHubTokenProxyEventType): void {
  const missingParams = []
  const requiredParams: RequiredParams[] = ['client_id', 'client_secret', 'code']
  for (const param of requiredParams) {
    if (!event[param]) missingParams.push(param)
  }
  if (missingParams.length) {
    const errorMessage = `Missing required parameters: ${missingParams.join(', ')}`
    console.error(errorMessage)
    throw new Error(errorMessage)
  }
}

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const result = querystringParse(event.body || '') as GitHubTokenProxyEventType
    checkParams(result)
    const tokenResponse = await (
      await fetch(
        `https://github.com/login/oauth/access_token?client_id=${result.client_id}&client_secret=${result.client_secret}&code=${result.code}`,
        {
          method: 'POST',
          headers: {
            accept: 'application/json',
          },
        },
      )
    ).json()
    const token = tokenResponse as tokenResponseType
    console.log('Successfully retrieved an access token from GitHub')
    return {
      statusCode: 200,
      body: JSON.stringify(token),
    }
  } catch (error) {
    console.error('Error in GitHub token proxy Lambda:', error)
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    }
  }
}
