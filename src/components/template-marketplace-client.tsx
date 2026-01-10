"use client";

import { useState } from "react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
    Search, 
    Clock, 
    Shield, 
    Target, 
    Users, 
    TrendingUp, 
    Star, 
    Eye,
    Copy,
    Trash2,
    Filter
} from "lucide-react";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { useRouter } from "next/navigation";

interface ExamTemplate {
    id: string;
    name: string;
    description?: string | null;
    duration: number;
    antiCheatEnabled: boolean;
    maxViolations: number;
    passPercentage: number;
    category?: string | null;
    usageCount?: number;
    isPublic?: boolean;
    createdAt: Date;
}

interface TemplateMarketplaceClientProps {
    userTemplates: any[];
    featuredTemplates: any[];
}

const CATEGORIES = [
    { id: "all", label: "All Templates", icon: Filter },
    { id: "academic", label: "Academic", icon: Users },
    { id: "certification", label: "Certification", icon: Star },
    { id: "practice", label: "Practice", icon: Target },
    { id: "assessment", label: "Assessment", icon: TrendingUp },
];

export function TemplateMarketplaceClient({
    userTemplates,
    featuredTemplates,
}: TemplateMarketplaceClientProps) {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("all");
    const [previewTemplate, setPreviewTemplate] = useState<ExamTemplate | null>(null);

    const filteredFeatured = featuredTemplates.filter((template) => {
        const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            template.description?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesCategory = selectedCategory === "all" || template.category === selectedCategory;
        return matchesSearch && matchesCategory;
    });

    const handleUseTemplate = (template: ExamTemplate) => {
        // Store template in session/local storage and redirect to create page
        localStorage.setItem("selectedTemplate", JSON.stringify(template));
        router.push("/dashboard/exams/create");
    };

    return (
        <div className="space-y-6">
            {/* Search and Filter Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                        placeholder="Search templates..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                    />
                </div>
            </div>

            {/* Category Pills */}
            <div className="flex gap-2 overflow-x-auto pb-2">
                {CATEGORIES.map((category) => (
                    <Button
                        key={category.id}
                        variant={selectedCategory === category.id ? "default" : "outline"}
                        size="sm"
                        onClick={() => setSelectedCategory(category.id)}
                        className="whitespace-nowrap"
                    >
                        <category.icon className="h-4 w-4 mr-2" />
                        {category.label}
                    </Button>
                ))}
            </div>

            <Tabs defaultValue="featured" className="space-y-6">
                <TabsList>
                    <TabsTrigger value="featured">
                        <Star className="h-4 w-4 mr-2" />
                        Featured
                    </TabsTrigger>
                    <TabsTrigger value="my-templates">
                        <Users className="h-4 w-4 mr-2" />
                        My Templates ({userTemplates.length})
                    </TabsTrigger>
                </TabsList>

                {/* Featured Templates */}
                <TabsContent value="featured" className="space-y-4">
                    {filteredFeatured.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                                <Search className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No templates found</p>
                                <p className="text-sm text-muted-foreground mt-1">Try adjusting your search or filters</p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {filteredFeatured.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={handleUseTemplate}
                                    onPreview={setPreviewTemplate}
                                    showActions
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>

                {/* My Templates */}
                <TabsContent value="my-templates" className="space-y-4">
                    {userTemplates.length === 0 ? (
                        <Card className="border-dashed">
                            <CardContent className="flex flex-col items-center justify-center h-64 text-center">
                                <Star className="h-12 w-12 text-muted-foreground mb-4" />
                                <p className="text-muted-foreground">No saved templates yet</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Create an exam and save it as a template for future use
                                </p>
                            </CardContent>
                        </Card>
                    ) : (
                        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
                            {userTemplates.map((template) => (
                                <TemplateCard
                                    key={template.id}
                                    template={template}
                                    onUse={handleUseTemplate}
                                    onPreview={setPreviewTemplate}
                                    showActions
                                    isOwned
                                />
                            ))}
                        </div>
                    )}
                </TabsContent>
            </Tabs>

            {/* Preview Dialog */}
            <TemplatePreviewDialog
                template={previewTemplate}
                open={!!previewTemplate}
                onOpenChange={(open) => !open && setPreviewTemplate(null)}
                onUse={handleUseTemplate}
            />
        </div>
    );
}

interface TemplateCardProps {
    template: ExamTemplate;
    onUse: (template: ExamTemplate) => void;
    onPreview: (template: ExamTemplate) => void;
    showActions?: boolean;
    isOwned?: boolean;
}

function TemplateCard({ template, onUse, onPreview, showActions, isOwned }: TemplateCardProps) {
    return (
        <Card className="group hover:shadow-lg transition-all hover:border-primary/50">
            <CardHeader>
                <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                        <CardTitle className="text-lg line-clamp-1">{template.name}</CardTitle>
                        {template.category && (
                            <Badge variant="secondary" className="mt-2 text-xs">
                                {template.category}
                            </Badge>
                        )}
                    </div>
                    {template.usageCount !== undefined && template.usageCount > 0 && (
                        <Badge variant="outline" className="text-xs">
                            <TrendingUp className="h-3 w-3 mr-1" />
                            {template.usageCount}
                        </Badge>
                    )}
                </div>
                <CardDescription className="line-clamp-2 mt-2">
                    {template.description || "No description provided"}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span>{template.duration} min</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Target className="h-4 w-4" />
                        <span>{template.passPercentage}% pass</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Shield className="h-4 w-4" />
                        <span>{template.antiCheatEnabled ? "Protected" : "Basic"}</span>
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                        <Users className="h-4 w-4" />
                        <span>{template.maxViolations} strikes</span>
                    </div>
                </div>
            </CardContent>
            <CardFooter className="gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onPreview(template)}
                    className="flex-1"
                >
                    <Eye className="h-4 w-4 mr-2" />
                    Preview
                </Button>
                <Button
                    size="sm"
                    onClick={() => onUse(template)}
                    className="flex-1"
                >
                    <Copy className="h-4 w-4 mr-2" />
                    Use Template
                </Button>
            </CardFooter>
        </Card>
    );
}

interface TemplatePreviewDialogProps {
    template: ExamTemplate | null;
    open: boolean;
    onOpenChange: (open: boolean) => void;
    onUse: (template: ExamTemplate) => void;
}

function TemplatePreviewDialog({ template, open, onOpenChange, onUse }: TemplatePreviewDialogProps) {
    if (!template) return null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{template.name}</DialogTitle>
                    <DialogDescription>
                        {template.description || "No description provided"}
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-6">
                    {/* Configuration Grid */}
                    <div className="grid gap-4 sm:grid-cols-2">
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Clock className="h-4 w-4" />
                                Duration
                            </h4>
                            <p className="text-sm text-muted-foreground">{template.duration} minutes</p>
                        </div>
                        
                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Target className="h-4 w-4" />
                                Pass Percentage
                            </h4>
                            <p className="text-sm text-muted-foreground">{template.passPercentage}%</p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm flex items-center gap-2">
                                <Shield className="h-4 w-4" />
                                Anti-Cheat
                            </h4>
                            <p className="text-sm text-muted-foreground">
                                {template.antiCheatEnabled ? `Enabled (${template.maxViolations} violations)` : "Disabled"}
                            </p>
                        </div>

                        <div className="space-y-2">
                            <h4 className="font-semibold text-sm">Category</h4>
                            <Badge variant="secondary">{template.category || "General"}</Badge>
                        </div>
                    </div>

                    <div className="flex gap-3 pt-4">
                        <Button variant="outline" onClick={() => onOpenChange(false)} className="flex-1">
                            Close
                        </Button>
                        <Button onClick={() => {
                            onUse(template);
                            onOpenChange(false);
                        }} className="flex-1">
                            <Copy className="h-4 w-4 mr-2" />
                            Use This Template
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    );
}
