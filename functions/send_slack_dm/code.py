#input_type_name: SendSlackDmInput
#output_type_name: SendSlackDmResult
#function_name: send_slack_dm

import json
import urllib.request
from pydantic import BaseModel
from lemma_sdk import FunctionContext


class SendSlackDmInput(BaseModel):
    owner_email: str
    message: str


class SendSlackDmResult(BaseModel):
    ok: bool
    error: str | None = None


VERCEL_URL = "https://meetflow-6x52m87oz-tmprtx5090-9818s-projects.vercel.app/api/send-dm"


async def send_slack_dm(ctx: FunctionContext, data: SendSlackDmInput) -> SendSlackDmResult:
    payload = json.dumps({"email": data.owner_email, "message": data.message}).encode("utf-8")
    req = urllib.request.Request(
        VERCEL_URL,
        data=payload,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=10) as resp:
            body = json.loads(resp.read().decode("utf-8"))
        return SendSlackDmResult(ok=body.get("ok", False), error=body.get("error"))
    except Exception as e:
        return SendSlackDmResult(ok=False, error=str(e))