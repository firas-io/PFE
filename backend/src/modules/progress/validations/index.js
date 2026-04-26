import { commonSchemas } from "./common.validation.js";

export default function loadCommonSchemas(app) {
  commonSchemas.forEach(s => app.addSchema(s));
}
