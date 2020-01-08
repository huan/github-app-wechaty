import { Application } from 'probot' // eslint-disable-line no-unused-vars
import {
  OnCallback,
}              from 'probot/lib/application'
import {
  WebhookPayloadIssues,
  WebhookPayloadIssueComment,
}                                 from '@octokit/webhooks'

import { UrlLinkPayload } from 'wechaty-puppet'

import FileBox from 'file-box'

let n = 0

const openIssue: OnCallback<WebhookPayloadIssues> = async (context) => {
  const fullName = context.payload.repository.full_name
  const issueNumber = context.payload.issue.number
  const issueTitle = context.payload.issue.title
  const issueBody = context.payload.issue.body
  const htmlUrl = context.payload.issue.html_url
  const avatarUrl = context.payload.repository.owner.avatar_url

  const title = [
    fullName,
    `#${issueNumber}`,
    issueTitle.slice(0, Math.max(issueTitle.length, 30)),
  ].join(' ')
  const url = htmlUrl
  const description = issueBody.slice(0, Math.max(issueBody.length, 70))
  const thumbnailUrl = avatarUrl

  if (!belongsToWechaty(context.payload.repository.owner.login)) {
    return
  }

  if (isBot(context.payload.issue.user.login)) {
    return
  }

  await wechatyBroadcastIssue({
    description,
    thumbnailUrl,
    title,
    url,
  })
}

const commentIssue: OnCallback<WebhookPayloadIssueComment> = async (context) => {
  // const issue = context .issue()
  // console.info(context.payload.repository)
  const fullName = context.payload.repository.full_name
  const issueNumber = context.payload.issue.number
  const issueTitle = context.payload.issue.title
  const commentBody = context.payload.comment.body
  const htmlUrl = context.payload.comment.html_url
  const avatarUrl = context.payload.comment.user.avatar_url

  const title = [
    fullName,
    `#${issueNumber}`,
    issueTitle.slice(0, Math.max(issueTitle.length, 30)),
  ].join(' ')
  const url = htmlUrl
  const description = commentBody.slice(0, Math.max(commentBody.length, 70))
  const thumbnailUrl = avatarUrl

  // console.info(context.payload.repository)

  if (!belongsToWechaty(context.payload.repository.owner.login)) {
    return
  }

  if (isBot(context.payload.issue.user.login)) {
    return
  }
  await wechatyBroadcastIssue({
    description,
    thumbnailUrl,
    title,
    url,
  })

  // const issueComment = context.issue({ body: `Thanks for comment this issue! ${n++}` })
  // await context.github.issues.createComment(issueComment)
  // console.info(context)
}

function belongsToWechaty (login: string): boolean {
  const matched = login.match(/^(chatie|wechaty)$/i)
  return matched !== null
}

function isBot (login: string): boolean {
  const matched = login.match(/\[bot\]$/i)
  return matched !== null
}

async function wechatyBroadcastIssue (
  payload: UrlLinkPayload,
) {
  console.info('callWebhook:', JSON.stringify(payload))

  let url = [
    'https://mike.zixia.net/wechaty/',
    [
      `url=${encodeURIComponent(payload.url)}`,
      `description=${encodeURIComponent(payload.description || '')}`,
      `thumbnailUrl=${encodeURIComponent(payload.thumbnailUrl || '')}`,
      `title=${encodeURIComponent(payload.title)}`,
    ].join('&'),
  ].join('?')

  if (process.env.MIKEBO_SECRET) {
    url = [
      url,
      `mikeboSecret=${process.env.MIKEBO_SECRET}`,
    ].join('&')
  }

  console.info('webhook url:', url)
  const result = (await FileBox.fromUrl(url).toBuffer()).toString()
  console.info('result:', result.substr(0, Math.min(100, result.length)))
}

export = (app: Application) => {
  app.on('issue_comment.created', commentIssue)
  app.on('issues.opened', openIssue)

  // For more information on building apps:
  // https://probot.github.io/docs/

  // To get your app running against GitHub, see:
  // https://probot.github.io/docs/development/
}
