exports.handler = async function (context, event, callback) {
  const {  Source, Body, Author, customer, rcsAgent } = event;

  // When the message is sent by the customer, we don't want to process it.
  if (Source === 'API' || !Author || Author.indexOf('rcs:') > -1) {
    console.log('It was the customer sending the message, therefore, aborting this webhook... We only to process when it is the Agent sending the message.');
    return callback(null);
  }

  console.log('new message to send: ', customer, rcsAgent, Body);
  
  const client = context.getTwilioClient();
  
  //send RCS to the customer
  await client.messages.create({
    from: rcsAgent,
    to: customer,
    body: Body
  });
  
  callback(null);
};
