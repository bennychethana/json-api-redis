import crypto from 'crypto';

export const generateEtag = (data) => {
  return crypto.createHash("md5").update(JSON.stringify(data)).digest("hex");
};