// Settings > Update track links to /__t3code/channel?channel=latest|nightly (hostedPairing.ts).
// T3's Vercel router (vercel.ts) proxied one host by cookie; here each channel has its own domain.
const CHANNEL_ORIGINS = {
  latest: "https://rc.vekrel.com",
  nightly: "https://rc-nightly.vekrel.com",
};

export default {
  fetch(request) {
    const channel = new URL(request.url).searchParams.get("channel");
    return Response.redirect(`${CHANNEL_ORIGINS[channel] ?? CHANNEL_ORIGINS.latest}/`, 302);
  },
};
