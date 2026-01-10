import { redirect } from "next/navigation";
import { verifySession } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { TemplateMarketplaceClient } from "@/components/template-marketplace-client";

export default async function TemplatesPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    // Fetch user's templates and featured templates
    let userTemplates: any[] = [];
    let featuredTemplates: any[] = [];

    try {
        userTemplates = await prisma.examTemplate.findMany({
            where: { teacherId: session.userId },
            orderBy: { createdAt: 'desc' }
        });

        // Fetch public/featured templates (you can add a 'isFeatured' or 'isPublic' field)
        featuredTemplates = await prisma.examTemplate.findMany({
            where: { 
                teacherId: session.userId
            },
            orderBy: { createdAt: 'desc' },
            take: 20
        });
    } catch (e) {
        console.error("Error fetching templates:", e);
    }

    return (
        <div className="flex-1 space-y-6">
            <div>
                <h2 className="text-3xl font-bold tracking-tight">Exam Templates</h2>
                <p className="text-muted-foreground mt-2">
                    Browse and use pre-configured exam templates to save time
                </p>
            </div>

            <TemplateMarketplaceClient
                userTemplates={userTemplates}
                featuredTemplates={featuredTemplates}
            />
        </div>
    );
}
