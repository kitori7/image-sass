import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import db from '@/server/db';

export default async function Home() {
  const users = await db.query.users.findMany();
  return (
    <div className="flex h-screen flex-col items-center justify-center">
      <form className="flex w-full max-w-md flex-col gap-4">
        <h1 className="text-center text-2xl font-bold">Create App</h1>
        <Input name="name" placeholder="App Name" />
        <Textarea name="description" placeholder="App Description" />
        <Button type="submit">Submit</Button>
      </form>
      <pre>{JSON.stringify(users, null, 2)}</pre>
    </div>
  );
}
