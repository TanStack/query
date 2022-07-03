import axios from "axios";

// let count = 0;

export async function fetchProjects(key) {
  console.info("fetch projects");
  // if (count < 4) {
  //   count++;
  //   throw new Error("testing");
  // }
  let { data } = await axios.get(
    `https://api.github.com/users/tannerlinsley/repos?sort=updated`
  );
  await new Promise((r) => setTimeout(r, 1000));
  return data;
}

export async function fetchProject(id) {
  console.info("fetch project id", id);
  let { data } = await axios.get(
    `https://api.github.com/repos/tannerlinsley/${id}`
  );
  await new Promise((r) => setTimeout(r, 1000));
  return data;
}
