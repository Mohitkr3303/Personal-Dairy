import NotesClient from "@/components/NotesClient";
import { dbConnect } from "@/lib/db";
import Image from "next/image";

export default async function Home() {
 await dbConnect()

 
  return (
    <div className="">
      <NotesClient/>
    </div>
  );
}
