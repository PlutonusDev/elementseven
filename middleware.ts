import { NextResponse, type NextRequest } from "next/server";

const AGE_COOKIE = "e7_age";
const EXEMPT = /^\/(api\/|_next\/|age-gate$|favicon\.ico$|uploads\/)/;

export function middleware(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  if (EXEMPT.test(pathname)) return NextResponse.next();
  if (request.cookies.get(AGE_COOKIE)?.value === "1") return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = "/age-gate";
  url.search = "";

  const headers = new Headers(request.headers);
  headers.set("x-age-gate-return", pathname + search);

  return NextResponse.rewrite(url, { request: { headers } });
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
