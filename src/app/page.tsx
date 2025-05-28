'use client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { trpc } from '@/components/trpc-provider';

export default function Home() {
  const hello = trpc.hello.useQuery();

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <form className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-center text-2xl font-bold">Create App</h1>
        {hello.data && <p className="text-center text-green-600">{hello.data}</p>}
        <Input name="name" placeholder="App Name" />
        <Textarea name="description" placeholder="App Description" />
        <Button type="submit">Submit</Button>
      </form>
    </div>
  );
}
