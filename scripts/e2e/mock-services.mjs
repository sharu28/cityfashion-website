// Local stand-in for Cloudflare Access, used only by the Playwright run.
// (Order email needs no stand-in: wrangler dev stores send_email messages locally.)
//   GET  /cdn-cgi/access/certs   -> public keys, like an Access team domain
//   GET  /__access-token?email=  -> a signed Access token for that email (for tests)
import http from "node:http";

import { exportJWK, generateKeyPair, SignJWT } from "jose";

import { accessAudience, mockPort, mockUrl } from "./test-values.mjs";

const { privateKey, publicKey } = await generateKeyPair("RS256");
const publicJwk = { ...(await exportJWK(publicKey)), kid: "e2e-key", alg: "RS256", use: "sig" };

function send(response, status, body) {
  response.writeHead(status, { "Content-Type": "application/json" });
  response.end(JSON.stringify(body));
}

const server = http.createServer(async (request, response) => {
  const url = new URL(request.url ?? "/", mockUrl);

  if (request.method === "GET" && url.pathname === "/cdn-cgi/access/certs") {
    return send(response, 200, { keys: [publicJwk], public_cert: {}, public_certs: [] });
  }

  if (request.method === "GET" && url.pathname === "/__access-token") {
    const token = await new SignJWT({ email: url.searchParams.get("email") ?? "", type: "app" })
      .setProtectedHeader({ alg: "RS256", kid: "e2e-key" })
      .setIssuer(url.searchParams.get("iss") ?? mockUrl)
      .setAudience(url.searchParams.get("aud") ?? accessAudience)
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);
    return send(response, 200, { token });
  }

  if (url.pathname === "/__health") return send(response, 200, { ok: true });
  return send(response, 404, { message: "not found" });
});

server.listen(mockPort, "127.0.0.1", () => {
  console.log(`E2E mock services ready on ${mockUrl}`);
});
