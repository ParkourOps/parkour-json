import { Request } from "express";
import { JsonRestApiResponse, Responder } from "./json-rest-api-response";

type JsonRestApiControllerMiddleware<
    TResponseData = unknown,
    TInputRequest extends Request = Request,
    TOutputRequest extends Request = Request
> = (request: TInputRequest, exit: (response: JsonRestApiResponse<TResponseData>)=>void) => Promise<TOutputRequest>;


export function makeMiddleware<TName extends string, TResponseData = unknown>(name: TName, handler: JsonRestApiControllerMiddleware<TResponseData>) {
    return {
        name,
        handler
    }
}


export type JsonRestApiControllerMiddlewareStack = ReturnType<typeof makeMiddleware>[];


export async function runMiddlewareStack(stack: JsonRestApiControllerMiddlewareStack, request: Request, responder: Responder<unknown>) {
    let req = request;
    let exit = false;

    // responds to request with output and exits the stack
    const exiter = (response: JsonRestApiResponse<unknown>)=>{
        responder.respond(response);
        exit = true;
    }
    
    let count = 1;
    for (const middleware of stack) {
        console.info(`running middleware #${count}: ${middleware.name}`);
        count++;
        // run this middleware
        req = await middleware.handler(req, exiter);
        // if this middleware set the exit flag, time to leave the function!
        if (<boolean>exit === true) {
            return;
        }
    }

    return req;
}
