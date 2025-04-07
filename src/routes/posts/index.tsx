import { createFileRoute, Link } from '@tanstack/react-router'

export const Route = createFileRoute('/posts/')({
  component: RouteComponent,
})

function RouteComponent() {
  const post = ["post1", "post2", "post3"]
  return (
    <div>
      {post.map((post) => (
        <div key={post}>
          <Link to={`/posts/$postId`} params={{ postId: post }}>{post}</Link>
        </div>
      ))}
    </div>
  )
}
