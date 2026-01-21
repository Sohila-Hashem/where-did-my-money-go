import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { toast } from "sonner";
import * as z from "zod";

import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "@/components/ui/card";
import { Field, FieldError, FieldGroup, FieldLabel } from "@/components/ui/field";
import {
	InputGroup,
	InputGroupAddon,
	InputGroupInput,
	InputGroupText,
} from "@/components/ui/input-group";
import { ExpenseCategoryEnum, type Expense } from "@/domain/expense";
import {
	Select,
	SelectContent,
	SelectGroup,
	SelectItem,
	SelectLabel,
	SelectTrigger,
	SelectValue,
} from "./ui/select";
import { v7 as uuidv7 } from "uuid";
import Calendar22 from "./calendar-22";
import { formatDate } from "@/lib/utils";

const formSchema = z.strictObject({
	description: z
		.string()
		.min(1, "Description must be at least 1 character.")
		.max(100, "Description must be at most 100 characters."),
	amount: z.coerce.number<number>().min(0.1, "Amount must be at least 0.1."),
	date: z.date("Transaction Date is required."),
	category: z.enum(ExpenseCategoryEnum, "Category is required."),
});

interface CreateExpenseFormProps {
	onNewExpense: (expense: Expense) => void;
}

export function CreateExpenseForm({ onNewExpense }: CreateExpenseFormProps) {
	const form = useForm<z.infer<typeof formSchema>>({
		resolver: zodResolver(formSchema),
		defaultValues: {
			amount: undefined,
			category: undefined,
			description: undefined,
			date: undefined,
		},
	});

	function onSubmit(data: z.infer<typeof formSchema>) {
		toast.success("Expense Added Successfully!", { id: "expense-added", duration: 2000 });
		const id = uuidv7();
		onNewExpense({ ...data, id, date: formatDate(data.date) });
		form.reset()
	} 1

	return (
		<Card className="w-full sm:max-w-md bg-accent text-primary shadow-lg">
			<CardHeader>
				<CardTitle>Expenses</CardTitle>
				<CardDescription>Add your daily expenses</CardDescription>
			</CardHeader>
			<CardContent>
				<form id="form-rhf-demo" onSubmit={form.handleSubmit(onSubmit)}>
					<FieldGroup>
						<Controller
							name="description"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="form-rhf-demo-description">
										Description
									</FieldLabel>
									<InputGroup>
										<InputGroupInput
											{...field}
											value={field.value ?? ""}
											id="form-rhf-demo-description"
											placeholder="e.g. Date with my wife, Family get-together, etc."
											className="resize-none"
											aria-invalid={fieldState.invalid}
										/>
										<InputGroupAddon align="block-end">
											<InputGroupText className="tabular-nums text-xs text-muted-foreground ms-auto">
												{field?.value?.length ?? 0}/100
											</InputGroupText>
										</InputGroupAddon>
									</InputGroup>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name="amount"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="form-rhf-demo-amount">Amount</FieldLabel>
									<InputGroup>
										<InputGroupInput
											{...field}
											type="number"
											value={field.value ?? ""}
											id="form-rhf-demo-amount"
											placeholder="e.g. 25.50"
											className="min-h-24 resize-none"
											aria-invalid={fieldState.invalid}
										/>
									</InputGroup>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name="date"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="form-rhf-demo-date">Transaction Date</FieldLabel>
									<Calendar22
										value={field.value ? new Date(field.value) : undefined}
										onChange={field.onChange}
									/>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
						<Controller
							name="category"
							control={form.control}
							render={({ field, fieldState }) => (
								<Field data-invalid={fieldState.invalid}>
									<FieldLabel htmlFor="form-rhf-demo-category">
										Category
									</FieldLabel>
									<Select {...field} value={field.value ?? ""} onValueChange={field.onChange}>
										<SelectTrigger className="w-full">
											<SelectValue placeholder="Select a category" />
										</SelectTrigger>
										<SelectContent position="popper">
											<SelectGroup>
												<SelectLabel>Categories</SelectLabel>
												{Object.values(ExpenseCategoryEnum).map(
													(category) => (
														<SelectItem key={category} value={category}>
															{category}
														</SelectItem>
													),
												)}
											</SelectGroup>
										</SelectContent>
									</Select>
									{fieldState.invalid && (
										<FieldError errors={[fieldState.error]} />
									)}
								</Field>
							)}
						/>
					</FieldGroup>
				</form>
			</CardContent>
			<CardFooter>
				<Field orientation="horizontal">
					<Button type="submit" form="form-rhf-demo" className="w-full cursor-pointer">
						Submit
					</Button>
				</Field>
			</CardFooter>
		</Card>
	);
}
