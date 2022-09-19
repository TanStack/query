import { redirect } from "react-router-dom";
import { deleteContact } from "../contacts";

export const action =
  (queryClient) =>
  async ({ params }) => {
    await deleteContact(params.contactId);
    queryClient.invalidateQueries(["contacts"]);
    return redirect("/");
  };
