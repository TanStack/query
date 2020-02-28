import axios from "axios";

export async function fetchProjects(key) {
  console.info("fetch projects");
  let { data } = await axios.get(
    `https://api.github.com/users/tannerlinsley/repos?sort=updated`
  );
  await new Promise(r => setTimeout(r, 1000));
  return data;
}

export async function fetchProject(key, { id }) {
  console.info("fetch project id", id);
  let { data } = await axios.get(
    `https://api.github.com/repos/tannerlinsley/${id}`
  );
  await new Promise(r => setTimeout(r, 1000));
  return data;
}
