import { baseUrl } from './apiConstants'

const loginUrl = userBarcode => `${baseUrl}/users/${userBarcode}`

async function login({ userBarcode }) {
	if (!userBarcode) {
		// No barcode supplied
		return {
			failureMessage: "Please enter a barcode number to login."
		}
	}
	else {
		// Try to load user
		try {
			const userResponse = await fetch(loginUrl(userBarcode))
			const user = await userResponse.json()

			const first_name = user.pref_first_name || user.first_name
			const last_name = user.pref_last_name || user.last_name

			return {
				userName: first_name + " " + last_name,
				userId: user.primary_id
			}
		}
		catch (error) {
			return {
				failureMessage: "Could not log in. Please try again or ask for help at the circulation desk."
			}
		}
	}
}
export default login