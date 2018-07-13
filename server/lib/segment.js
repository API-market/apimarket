require('dotenv')
const Analytics = require('analytics-node')
const base64 = require('base-64')
const segmentKey = base64.decode("aThDVFVJNEJYRjlnWlVrZUhuUjJkYmR6S3JXY2E3SHM")
const analytics = new Analytics(segmentKey)

module.exports = function analyticsEvent(userId, eventName, eventMetadata={}) {  
    analytics.track({
      event: eventName,
      properties: eventMetadata,
      userId: userId
    });
  }