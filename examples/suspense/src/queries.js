export async function fetchProjects() {
  return (await fetch(
    `https://api.github.com/users/tannerlinsley/repos?sort=updated`
  )).json();
}

export async function fetchProject({ id }) {
  return (await fetch(
    `https://api.github.com/repos/tannerlinsley/${id}`
  )).json();
}
