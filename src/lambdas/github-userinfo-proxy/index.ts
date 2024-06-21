/* eslint-disable max-lines-per-function */
import {APIGatewayEvent, APIGatewayProxyResult} from 'aws-lambda'
import fetch from 'node-fetch'

export const handler = async (event: APIGatewayEvent): Promise<APIGatewayProxyResult> => {
  try {
    const bearerToken = event.headers['Authorization']?.split('Bearer ')[1]

    if (!bearerToken) {
      const errorMessage = 'Missing bearer token'
      console.error(errorMessage)
      return {
        statusCode: 401,
        body: JSON.stringify({
          error: errorMessage,
        }),
      }
    }

    console.log('Getting the user from GitHub API...')
    const token = (await (
      await fetch('https://api.github.com/user', {
        method: 'GET',
        headers: {
          authorization: `token ${bearerToken}`,
          accept: 'application/json',
        },
      })
    ).json()) as {id: string; email: string}

    let email = token.email

    if (email === null) {
      console.log('Getting the user email from GitHub API...')
      const emails = (await (
        await fetch('https://api.github.com/user/emails', {
          method: 'GET',
          headers: {
            authorization: `token ${bearerToken}`,
            accept: 'application/json',
          },
        })
      ).json()) as {email: string; primary: boolean; verified: boolean}[]

      const primaryEmailObj = emails.find((email) => email.primary)
      if (primaryEmailObj) {
        email = primaryEmailObj.email
      }
    }

    console.log('Returning the OIDC token with the user info')

    return {
      statusCode: 200,
      body: JSON.stringify({
        ...token,
        sub: token.id,
        email: email,
        githubAccessToken: bearerToken,
      }),
    }
  } catch (error) {
    console.error('Error in GitHub user info proxy Lambda:', error)
    return {
      statusCode: 500,
      body: JSON.stringify(error),
    }
  }
}
