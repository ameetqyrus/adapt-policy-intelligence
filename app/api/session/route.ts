import { identity, json, fail, testingAvailable } from "@/lib/server";
export async function GET(request: Request) {
  try {
    const user=identity(request);return json({...user,testingAvailable:testingAvailable(user)});
  } catch (e) {
    return fail(e);
  }
}
