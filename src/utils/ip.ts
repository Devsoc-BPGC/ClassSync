import { headers } from "next/headers";



export async function getUserIp(){
    const headersList = await headers();
    const ip = headersList.get("x-forwarded-for") || headersList.get("x-real-ip") || headersList.get("cf-connecting-ip") || headersList.get("x-client-ip") || headersList.get("x-cluster-client-ip") || headersList.get("x-forwarded") || headersList.get("forwarded-for") || headersList.get("forwarded");
    return ip ? ip.split(',')[0].trim() : '0.0.0.0';
}