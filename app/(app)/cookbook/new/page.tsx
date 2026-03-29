import { CreateCookbookForm } from '@/components/cookbook/create-cookbook-form'

export default function NewCookbookPage() {
  return (
    <div className="p-6 max-w-lg mx-auto">
      <h1 className="text-lg text-foreground mb-2">~/cookbooks/new</h1>
      <p className="text-muted-foreground text-sm mb-6">
        &gt; create a new cookbook (GitHub repo with .gitrecipe marker)
      </p>
      <CreateCookbookForm />
    </div>
  )
}
