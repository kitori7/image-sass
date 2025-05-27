import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { getServerSession } from '@/server/auth';
import { redirect } from 'next/navigation';

export default async function Home() {
  const session = await getServerSession();

  if (!session?.user) {
    redirect('/api/auth/signin');
  }

  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <form className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-center text-2xl font-bold">Create App</h1>
        <Input name="name" placeholder="App Name" />
        <Textarea name="description" placeholder="App Description" />
        <Button type="submit">Submit</Button>
      </form>
      <pre>{JSON.stringify(session, null, 2)}</pre>
    </div>
  );
}
