import React from 'react'

export function useHubspotForm({ portalId, formId, fields }) {
	const [$response, set$response] = React.useState(null)
	const [$result, set$result] = React.useState(null)

	async function onSubmit(e) {
		e.preventDefault()

		const fields = Array.from(e.target.elements)
			.filter(({ name }) => !!name)
			.map(input => ({
				name: input.name,
				value: input.type == 'checkbox' ? String(input.checked) : input.value,
			}))

		const response = await submitHubspot({ portalId, formId, fields })
		set$response(response)
		set$result(response?.ok && await response.json())
	}

	const Fields = fields.map(field => {
		const Field =
			field.type === 'checkbox' ? Checkbox :
			field.type === 'select' ? Select :
			field.type === 'textarea' ? Textarea :
			Input

		return ({ component: Component = Field, ...props } = {}) =>
			<Component {...field} {...props} />
	})

	const Form = ({ children, ...props }) => {
		// redirect
		if ($response?.ok && !!$result?.redirectUri) {
			window.location.href = $result.redirectUri
			return <p>Redirecting...</p>
		}

		// response message
		if ($response?.ok && !!$result?.inlineMessage) {
			return <div dangerouslySetInnerHTML={{ __html: $result.inlineMessage }} />
		}

		return <form onSubmit={onSubmit} {...props}>
			{children || <>
				{Fields?.map((Field, key) => <Field key={key} />)}
				<button type="submit">Submit</button>
			</>}
		</form>
	}

	return {
		onSubmit,
		response: $response,
		result: $result,
		Fields,
		Form,
	}
}

async function submitHubspot({ portalId, formId, fields }) {
	const url = `https://api.hsforms.com/submissions/v3/integration/submit/${ portalId }/${ formId }`
	return await fetch(url, {
		method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ fields })
	})
}

/* fields */

const Input = ({ label, className, value, ...props }) => (
	// TODO: add error handling
	<label htmlFor={props.name} className={className}>
		<small>{label}{props.required && <span>*</span>}</small>
		<input
			id={props.name}
			placeholder={label}
			defaultValue={value}
			{...props}
		/>
	</label>
)

const Textarea = ({ label, className, value, ...props }) => (
	<label htmlFor={props.name}>
		<small>{label}{props.required && <span>*</span>}</small>
		<textarea
			id={props.name}
			placeholder={label}
			children={value}
			{...props}
		/>
	</label>
)

const Select = ({ label, options, value = '', className, ...props }) => (
	<label htmlFor={props.name} className={className}>
		<small>{label}{props.required && <span>*</span>}</small>
		<select id={props.name} defaultValue={value} {...props}>
			<option value="" disabled>Please select</option>
			{options?.map((option, key) => (
				<option value={option} key={key}>{option}</option>
			))}
		</select>
	</label>
)

const Checkbox = ({ label, className, value, ...props }) => (
	<label htmlFor={props.name} className={className}>
		<input
			id={props.name}
			defaultChecked={value}
			defaultValue={value}
			{...props}
		/>
		{label}
	</label>
)
