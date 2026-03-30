'use client'

import { useQuery } from '@tanstack/react-query'
import { commitQueryOptions } from '@/lib/queries/history'
import type { GitHubCommitFile } from '@/types'

function DiffPatch({ patch }: { patch: string }) {
  const lines = patch.split('\n')

  return (
    <pre className="text-xs overflow-x-auto">
      {lines.map((line, i) => {
        let cls = 'text-muted-foreground'
        if (line.startsWith('+')) cls = 'text-green-500'
        else if (line.startsWith('-')) cls = 'text-red-500'
        else if (line.startsWith('@@')) cls = 'text-accent'

        return (
          <div key={i} className={cls}>
            {line}
          </div>
        )
      })}
    </pre>
  )
}

function FileEntry({ file }: { file: GitHubCommitFile }) {
  const statusLabel: Record<string, string> = {
    added: '+',
    removed: '-',
    modified: 'M',
    renamed: 'R',
  }

  const statusColor: Record<string, string> = {
    added: 'text-green-500',
    removed: 'text-red-500',
    modified: 'text-accent',
    renamed: 'text-accent',
  }

  return (
    <div className="mb-3 last:mb-0">
      <div className="flex items-center gap-2 text-xs mb-1">
        <span className={statusColor[file.status] ?? 'text-muted-foreground'}>
          {statusLabel[file.status] ?? '?'}
        </span>
        <span className="text-foreground">{file.filename}</span>
        <span className="text-muted-foreground">
          +{file.additions} -{file.deletions}
        </span>
      </div>
      {file.patch && <DiffPatch patch={file.patch} />}
      {!file.patch && file.status !== 'removed' && (
        <div className="text-xs text-muted-foreground italic">binary file changed</div>
      )}
    </div>
  )
}

export function CommitDetail({
  owner,
  repo,
  sha,
}: {
  owner: string
  repo: string
  sha: string
}) {
  const { data: commit, isLoading } = useQuery(
    commitQueryOptions(owner, repo, sha),
  )

  if (isLoading) {
    return <div className="text-muted-foreground text-xs py-1">[ ... ]</div>
  }

  if (!commit?.files || commit.files.length === 0) {
    return (
      <div className="text-muted-foreground text-xs py-1">
        no file changes
      </div>
    )
  }

  return (
    <div className="border border-border/50 p-3 bg-background">
      <div className="text-xs text-muted-foreground mb-2">
        $ git diff {sha.slice(0, 7)}
      </div>
      {commit.files.map((file) => (
        <FileEntry key={file.sha + file.filename} file={file} />
      ))}
    </div>
  )
}
