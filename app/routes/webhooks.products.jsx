import { authenticate } from "../shopify.server";
// import db from "../db.server";

export const action = async ({ request }) => {
  const { payload, session, topic, shop } = await authenticate.webhook(request);

  console.log(`Received ${topic} webhook for ${shop} in session ${JSON.stringify(session)} with ${JSON.stringify(payload)}`);

  return new Response();
};
