import * as React from "react";
import * as ReactDOM from "react-dom/client";
import { DataBrowserRouter, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { ReactQueryDevtools } from "@tanstack/react-query-devtools";

import "./index.css";

import ErrorPage from "./error-page";
import Root, {
  loader as rootLoader,
  action as rootAction,
} from "./routes/root";
import Contact, {
  loader as contactLoader,
  action as contactAction,
} from "./routes/contact";
import EditContact, { action as editAction } from "./routes/edit";
import { action as destroyAction } from "./routes/destroy";
import Index from "./routes/index";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 10,
    },
  },
});

const rootElement = document.getElementById("root");
ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <DataBrowserRouter>
        <Route
          path="/"
          element={<Root />}
          errorElement={<ErrorPage />}
          loader={rootLoader(queryClient)}
          action={rootAction(queryClient)}
        >
          <Route index element={<Index />} />
          <Route
            path="contacts/:contactId"
            element={<Contact />}
            loader={contactLoader(queryClient)}
            action={contactAction(queryClient)}
          />
          <Route
            path="contacts/:contactId/edit"
            element={<EditContact />}
            loader={contactLoader(queryClient)}
            action={editAction(queryClient)}
          />
          <Route
            path="contacts/:contactId/destroy"
            action={destroyAction(queryClient)}
            errorElement={<div>Oops! There was an error.</div>}
          />
        </Route>
      </DataBrowserRouter>
      <ReactQueryDevtools position="bottom-right" />
    </QueryClientProvider>
  </React.StrictMode>
);
