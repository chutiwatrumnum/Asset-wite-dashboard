import liff from "@line/liff";
import { useEffect } from "react";
import { Input } from "@/components/ui/input.tsx";
import { Car, KeyIcon } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

export default function LineApp() {
  useEffect(() => {
    (async () => {
      await liff.init({ liffId: "1656120478-Njkdm9n2" });
      if (!liff.isLoggedIn()) {
        // liff.login();
        return;
      }
    })();
  }, []);
  return (
    <>
      <div className="flex flex-1 justify-center items-center font-anuphan text-2xl h-lvh select-none">
        <div className="justify-center min-w-[240px] p-auto items-center font-anuphan text-xl">
          <Car className="m-auto animate-bounce" size="72"/>
          <div className="text-2xl text-center mt-8 mb-8">บัตรจอดรถ AiTAN</div>
          <span>
            <Input className="mt-4 text-center" type="text" lang="th" placeholder="ป้ายทะเบียนรถของคุณ"/>
            <Input className="mt-4 text-center" type="text" lang="th" placeholder="จังหวัด"/>
            <Input className="mt-4 mb-6 text-center" type="text" placeholder="หมายเลขห้องที่ต้องการติดต่อ"/>
          </span>
          <Button className="w-full h-12" onClick={() => {
            alert("hello world");
          }}>
            <KeyIcon/> ส่งคำขอไปยังลูกบ้าน
          </Button>
        </div>
      </div>
    </>
  )
}
