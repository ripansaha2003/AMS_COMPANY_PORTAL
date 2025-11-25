import React from "react";
import {
    Breadcrumb,
    BreadcrumbItem,
    BreadcrumbLink,
    BreadcrumbList,
    BreadcrumbPage,
    BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { Link } from "react-router-dom";
import { useArray } from "@/context/LocationContext"; 

export default function LocationBreadcrumb() {
    const { array } = useArray();

    if (!array || array.length === 0) return null;

    return (
        <Breadcrumb>
            <BreadcrumbList>
                {array.map((item, idx) => (
                    <React.Fragment key={item.link || item.label || idx}>
                        <BreadcrumbItem>
                            {idx < array.length - 1 ? (
                                <BreadcrumbLink asChild>
                                    <Link to={item.link}>{item.label}</Link>
                                </BreadcrumbLink>
                            ) : (
                                <BreadcrumbPage className="font-medium">{item.label}</BreadcrumbPage>
                            )}
                        </BreadcrumbItem>
                        {idx < array.length - 1 && (
                            <BreadcrumbSeparator className="-mx-1">/</BreadcrumbSeparator>
                        )}
                    </React.Fragment>
                ))}
            </BreadcrumbList>
        </Breadcrumb>
    );
}
