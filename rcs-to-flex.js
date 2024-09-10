// Get your Studio Flow SID and put it here...
const STUDIO_FLOW_SID = 'FWxxxxxxxxxx';

exports.handler = async function (context, event, callback) {
  const { DOMAIN_NAME } = context;
  const body = event.Body;
  const from = event.From; // rcs:+49176728xxxxx
  const to = event.To; // rcs:twilio_etc_agent

  const uniqueName = `rcs-${from}-${to}`.replace(/rcs:/g, '');

  console.log('new incoming message: ', DOMAIN_NAME, body, from, to);

  const client = context.getTwilioClient();

  // Step 1
  const { channelSid, status } = await createConversation(client, uniqueName, from, to);

  // Step 2
  if (status === 'NEW_CHANNEL') {
    await configureWebhooks(client, channelSid, from, to, DOMAIN_NAME);
  }

  // Step 3
  await client.conversations.v1.conversations(channelSid).messages.create({
    author: from,
    body: body,
    xTwilioWebhookEnabled: true,
  });
  console.log('step 3/3: message sent: ', from, body);

  callback(null);
};

async function createConversation(client, uniqueName) {
  // Create a conversation
  try {
    const conversation = await client.conversations.v1.conversations.create({
      // friendlyName: uniqueName,
      uniqueName      
    });

    channelSid = conversation.sid;

    console.log('step 1/3: conversation created: ', channelSid);
    return { channelSid, status: 'NEW_CHANNEL' };
  } catch (error) {    
    //Conversation with provided unique name already exists
    if (error.code !== 50353) {      
      throw error;
    }

    const conversations = await client.conversations.v1.conversations.list({ uniqueName, limit: 1 });
    channelSid = conversations[0].sid;

    // Conversation is already closed, deleting to re-create it.
    if (conversations[0].state === 'closed') {
      console.log('step 1/3: conversation is closed, deleting it to re-create it...', channelSid);      
      await client.conversations.v1.conversations(channelSid).remove();
      return createConversation(client, uniqueName);
    }
    
    console.log('step 1/3: conversation already exists: ', channelSid);
    return { channelSid, status: 'EXISTING_CHANNEL' };
  }
}

async function configureWebhooks(client, channelSid, from, to, DOMAIN_NAME) {
  // Create one virtual participant. It is needed else Flex breaks.
  const promise1 = client.conversations.v1.conversations(channelSid).participants.create({ identity: from });
  
  // Webhook 1 - Once the Customer sends a message, Studio flow will be triggered
  const promise2 = client.conversations.v1.conversations(channelSid).webhooks.create({
    'configuration.filters': 'onMessageAdded',
    target: 'studio',
    'configuration.flowSid': STUDIO_FLOW_SID,
  });

  // Webhook 2 - Once the Agent sends a message, the webhook /step3-flex-to-textit will be called to send a message to Viber
  const promise3 = client.conversations.v1.conversations(channelSid).webhooks.create({
    target: 'webhook',
    'configuration.filters': 'onMessageAdded',
    'configuration.method': 'POST',
    'configuration.url': `https://${DOMAIN_NAME}/flex-to-rcs?customer=${encodeURIComponent(from)}&rcsAgent=${encodeURIComponent(to)}`,
  });

  await Promise.all([promise1, promise2, promise3]);
  console.log('step 2/3: webhooks configured');
}
