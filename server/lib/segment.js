require('dotenv')
const Analytics = require('analytics-node')
const analytics = new Analytics("i8CTUI4BXF9gZUkeHnR2dbdzKrWca7Hs")

module.exports = function analyticsEvent(userId, eventName, eventMetadata={}) {  
    console.log("in segment", eventMetadata)
    analytics.track({
      event: eventName,
      properties: eventMetadata,
      userId: userId
    });
  }