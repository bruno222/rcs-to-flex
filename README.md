
## Quick tutorial on how to integrate RCS into Flex.

**Step 1**: Deploy both functions [rcs-to-flex](https://github.com/bruno222/rcs-to-flex/blob/main/rcs-to-flex.js) and [flex-to-rcs](https://github.com/bruno222/rcs-to-flex/blob/main/flex-to-rcs.js) manually into Twilio Functions.

**Step 2**: Dont forget to put your Studio Flow SID [here](https://github.com/bruno222/rcs-to-flex/blob/main/rcs-to-flex.js#L2). Your Studio flow can be as simple as the below. The important part is to have the `Send to Flex` widget with the `Task Channel: Chat`.
<img width="995" alt="image" src="https://github.com/user-attachments/assets/b1da42ae-ac8b-4ef7-b590-525494a46c23">
<p></p>

**Step 3**: Configure a new Messaging Service and add the Senders there. One of them must be the your RCS agent, something like `rcs:your_agent_name`, like the screenshot below.
<img width="1493" alt="image" src="https://github.com/user-attachments/assets/bbac4584-f922-4254-b521-bf43b18152f8">
<p></p>

**Step 4**: Under the Integration menu of your Messaging Service, add the full URL of the function `/rcs-to-flex` that you have deployed on Step 1, like the below:
<img width="1321" alt="image" src="https://github.com/user-attachments/assets/d12fc268-0a99-4898-b429-405d6d2f9353">
<p></p>

**Step 5**: Send manually an outbound message to your phone to have the first interaction happening like the example below. You dont need to set the `from` attribute as the MessagingService will try to to send via RCS first and, in case the phone does not have RCS enabled, it will fallback to the other Senders you have within this MessageService (in our screenshot example it would send an SMS then). In a real-world scenario here is where you have the Broadcast to your customers, but for now, let's just send one message to your phone:

```
curl -X POST "https://api.twilio.com/2010-04-01/Accounts/ACxxxxxxxxx/Messages.json" \
--data-urlencode "MessagingServiceSid=MGxxxxxxx" \
--data-urlencode "Body=This is a message sent from a Messaging Service." \
--data-urlencode "To=<your-phone-number>" \
-u ACxxxx:AUTH_TOKEN
```

You should have received an RCS message like:

![image](https://github.com/user-attachments/assets/29878c67-f211-4b78-98d0-596a4189f7fa)

**Step 6**: If you reply back, the next available Agent in Flex will receive the task:

<img width="399" alt="image" src="https://github.com/user-attachments/assets/9d19f1bb-b2cc-4196-aaf0-6db8533ec43f">
<p></p>

**Step 7**: Once the agent accepts the Task, the Agent can of course send RCS messages to the customer and vice-versa.

<img width="346" alt="image" src="https://github.com/user-attachments/assets/a8f44467-a74f-4dc2-b9ba-ae0e46944efe">

---

**Known-issue**: On **Step 2**, the Studio flow there has a "Send Message" widget, it won't work because, long-story short, Studio does not send messages under the hood with the parameter `xTwilioWebhookEnabled` set like we see it [here](https://github.com/bruno222/rcs-to-flex/blob/main/rcs-to-flex.js#L28C5-L28C26), therefore the webhook `/flex-to-rcs` doesn't get triggered and this integration does not have a way of knowing when Studio sends messages.

---

This repository was inspired by [this repository](https://github.com/leroychan/twilio-flex-conversations-adapters/tree/master) that contains examples of integrations of various custom channels.
