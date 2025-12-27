import { prisma } from "@/lib/prisma";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Check } from "lucide-react";
import { verifySession } from "@/lib/session";
import { redirect } from "next/navigation";
import { buyCreditsAction, upgradeSubscriptionAction } from "@/actions/payment";
import { Prisma } from "@prisma/client";

type Payment = Prisma.PaymentGetPayload<{}>;

export default async function BillingPage() {
    const session = await verifySession();
    if (!session) return redirect("/login");

    let user = null;
    let payments: Payment[] = [];

    try {
        user = await prisma.user.findUnique({
            where: { id: session.userId }
        });

        payments = await prisma.payment.findMany({
            where: { teacherId: session.userId },
            orderBy: { createdAt: 'desc' },
            take: 5
        });
    } catch (e) {
        console.error("Billing Loading Error", e);
    }

    // Fallback for UI visualization if new user
    const credits = user?.credits || 0;
    const isPro = user?.planType === "PRO";

    return (
        <div className="flex-1 space-y-4 p-4 pt-6">
            <h2 className="text-3xl font-bold tracking-tight">Billing & Plans</h2>

            <div className="max-w-4xl mt-6">
                {isPro ? (
                    <Card className="flex flex-col border-primary/20 shadow-lg relative overflow-hidden max-w-md">
                        <div className="absolute top-0 right-0 bg-green-600 text-white text-xs px-3 py-1 rounded-bl-lg font-medium">Active</div>
                        <CardHeader>
                            <CardTitle className="text-2xl">Pro Subscription</CardTitle>
                            <CardDescription>Unlimited exams active.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="text-4xl font-bold">$15 <span className="text-lg font-normal text-muted-foreground">/month</span></div>
                            <ul className="space-y-2 text-sm">
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Unlimited Exams</li>
                                <li className="flex items-center"><Check className="mr-2 h-4 w-4 text-green-500" /> Advanced Analytics</li>
                            </ul>
                            <p className="text-sm text-muted-foreground mt-4">Next billing date: {new Date().toLocaleDateString()}</p>
                        </CardContent>
                        <CardFooter>
                            <Button variant="outline" className="w-full">Manage Subscription</Button>
                        </CardFooter>
                    </Card>
                ) : (
                    <Card className="flex flex-col max-w-md">
                        <CardHeader>
                            <CardTitle className="text-2xl">Exam Credits</CardTitle>
                            <CardDescription>Pay only when you publish.</CardDescription>
                        </CardHeader>
                        <CardContent className="flex-1 space-y-4">
                            <div className="flex items-baseline justify-between border-b pb-4">
                                <span className="text-sm font-medium text-muted-foreground">Current Balance</span>
                                <span className="text-4xl font-bold">{credits}</span>
                            </div>

                            <div className="space-y-4">
                                <div className="p-4 border rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors flex justify-between items-center">
                                    <div>
                                        <div className="font-bold">1 Credit</div>
                                        <div className="text-xs text-muted-foreground">$1.00</div>
                                    </div>
                                    <form action={async (formData) => {
                                        "use server"
                                        await buyCreditsAction(formData)
                                    }}>
                                        <input type="hidden" name="amount" value="1" />
                                        <input type="hidden" name="cost" value="100" />
                                        <Button size="sm" type="submit">Buy</Button>
                                    </form>
                                </div>
                                <div className="p-4 border rounded-lg bg-muted/20 hover:bg-muted/40 cursor-pointer transition-colors flex justify-between items-center relative overflow-hidden">
                                    <div className="absolute top-0 right-0 bg-primary/10 text-primary text-[10px] px-2 py-0.5 rounded-bl">Popular</div>
                                    <div>
                                        <div className="font-bold">10 Credits</div>
                                        <div className="text-xs text-muted-foreground">$9.00 (Save 10%)</div>
                                    </div>
                                    <form action={async (formData) => {
                                        "use server"
                                        await buyCreditsAction(formData)
                                    }}>
                                        <input type="hidden" name="amount" value="10" />
                                        <input type="hidden" name="cost" value="900" />
                                        <Button size="sm" type="submit">Buy</Button>
                                    </form>
                                </div>

                                <div className="p-4 border border-primary/20 rounded-lg bg-primary/5 hover:bg-primary/10 cursor-pointer transition-colors flex justify-between items-center">
                                    <div>
                                        <div className="font-bold text-primary">Upgrade to Pro</div>
                                        <div className="text-xs text-muted-foreground">$15.00 / month</div>
                                    </div>
                                    <form action={async (formData) => {
                                        "use server"
                                        await upgradeSubscriptionAction(formData)
                                    }}>
                                        <Button size="sm" variant="default" type="submit">Upgrade</Button>
                                    </form>
                                </div>
                            </div>
                        </CardContent>
                    </Card>
                )}
            </div>

            <div className="mt-8 rounded-lg border p-4 bg-muted/50 max-w-4xl">
                <h3 className="font-semibold mb-4">Transaction History</h3>
                {payments.length === 0 ? (
                    <div className="text-sm text-muted-foreground">No transactions found.</div>
                ) : (
                    <div className="space-y-2">
                        {payments.map((payment) => (
                            <div key={payment.id} className="flex justify-between items-center bg-background p-3 rounded border">
                                <div>
                                    <div className="font-medium text-sm">{payment.type.replace('_', ' ')}</div>
                                    <div className="text-xs text-muted-foreground">{new Date(payment.createdAt).toLocaleDateString()}</div>
                                </div>
                                <div className="flex items-center gap-2">
                                    <span className={`text-xs px-2 py-1 rounded-full ${payment.status === 'COMPLETED' ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                        {payment.status}
                                    </span>
                                    <span className="font-bold text-sm">${(payment.amount / 100).toFixed(2)}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
