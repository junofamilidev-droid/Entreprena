import Link from "next/link";
import { Fragment } from "react";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { TopBar } from "./top-bar";

// En-tête de page : barre du haut (menu, recherche, compte), puis le fil d'Ariane s'il y a lieu.
export function PageHeader({ crumbs }: { crumbs: { label: string; href?: string }[] }) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/80">
        <TopBar />
      </header>
      {crumbs.length > 1 && (
        <Breadcrumb className="mx-auto w-full max-w-5xl px-4 pt-5 sm:px-8">
          <BreadcrumbList>
            {crumbs.map((c, i) => {
              const last = i === crumbs.length - 1;
              return (
                <Fragment key={c.label}>
                  {i > 0 && <BreadcrumbSeparator />}
                  <BreadcrumbItem>
                    {last || !c.href ? (
                      <BreadcrumbPage>{c.label}</BreadcrumbPage>
                    ) : (
                      <BreadcrumbLink asChild>
                        <Link href={c.href}>{c.label}</Link>
                      </BreadcrumbLink>
                    )}
                  </BreadcrumbItem>
                </Fragment>
              );
            })}
          </BreadcrumbList>
        </Breadcrumb>
      )}
    </>
  );
}
