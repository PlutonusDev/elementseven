import { AccessBanner } from "@/components/store/access-banner";
import { StoreFooter } from "@/components/store/footer";
import { StoreHeader } from "@/components/store/header";
import { Ticker } from "@/components/store/ticker";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(155deg, #edf0fd 0%, #f4f5fa 24%, #f7f7f5 50%, #faf4ec 76%, #fbf0e2 100%)",
          }}
        />
        <div
          className="absolute -top-32 -left-40 h-[42rem] w-[42rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(46,69,255,0.18), transparent 68%)" }}
        />
        <div
          className="absolute top-1/4 -right-48 h-[46rem] w-[46rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,122,26,0.16), transparent 68%)" }}
        />
        <div
          className="absolute -bottom-40 left-1/5 h-[40rem] w-[40rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(46,69,255,0.13), transparent 70%)" }}
        />
        <div
          className="absolute top-1/2 left-1/3 h-[30rem] w-[30rem] rounded-full blur-3xl"
          style={{ background: "radial-gradient(circle, rgba(255,122,26,0.11), transparent 70%)" }}
        />
        <div className="dot-grid absolute inset-0 opacity-[0.06]" />
      </div>

      <div className="flex min-h-dvh flex-col overflow-x-clip">
        <StoreHeader />
        <Ticker />
        <AccessBanner />
        <main className="mx-auto w-full max-w-6xl flex-1 px-4">{children}</main>
        <StoreFooter />
      </div>
    </>
  );
}
