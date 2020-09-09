/* CONSTANTS */
const protocol = window.location.protocol + "//";
const hostname = window.location.hostname;
const port = window.location.port;
const baseURL = port ? (protocol + hostname + ":" + port) : (protocol + hostname);

// This is some kind of clever black magic that makes "document" work in functions
const $ = query => document.querySelector(query)

const hide = (el) => {
	el.classList.add("hide")
}
const show = (el) => {
	el.classList.remove("hide")
}

let TOUCH = false
const configure_for_touch = () => {
	$("#idinstruction").textContent = "Please scan your ID:"
	$("#submit").remove()
	$("#logoutinstruction").textContent = "Scan your ID again to logout"
	$("#iteminstruction").textContent = "Please scan your next item:"
}

async function initiate() {
	getModalBox();

	$("#barcode").onkeyup = (e) => {
		if (e.key === "Enter") { // e.code = e.key = "Enter" == e.which = 13
			loan()
		}
	}

	$("#userid").onkeyup = (e) => {
		if (e.key === "Enter") { // e.code = e.key = "Enter" == e.which = 13
			login()
		}
	}

	const istouch = await fetch("/is-touch").then(r => r.json())
	if ("touch" in istouch) {
		TOUCH = istouch.touch
		configure_for_touch()
	} else {
		console.error("Failed to query `/is-touch` endpoint")
	}
}

var modal;
var span;
var user;
var sessiontimer;
var defaultTimeout = 60

function getModalBox() {
	hide($("#myModal"))

	// When the user clicks on <span> (x), close the modal
	$("#modalclosex").onclick = () => {
		hide($("#myModal"))
	}
}

function returnToBarcode() {
	$("#barcode").disabled = false;
	hide($("#myModal"))

	$("#barcode").value = ""
	$("#barcode").focus()
}


/* LOGIN */

function login() {
	let loginid = $("#userid").value
	if ((loginid != null) && (loginid != "")) {

		$("#userid").disabled = true
		hide($("#loginerror"))

		$("#modalheader").textContent = "Loading data, please wait..."
		show($("#myModal"))
		hide($("#modalclosex"))

		// console.log(baseURL+"/users/"+loginid)
		fetch(baseURL + "/users/" + $("#userid").value)
			.then(r => r.json())
			.then((data) => {
				user = data
				// prepare scan box
				$("#scanboxtitle").textContent = "Welcome " + data.first_name + " " + data.last_name
				$("#userloans").textContent = data.loans.value
				$("#userrequests").textContent = data.requests.value
				$("#userfees").textContent = "$" + data.fees.value
				let timeoutspan = document.querySelector("#usertimeout")
				// console.log(timeoutspan)
				sessionTimeout(defaultTimeout, timeoutspan)
				//$("#usernotes").textContent = data.user_note.length

				// Remove loaned data
				Array.from($("#loanstable tbody").children).forEach(child => child.remove())

				hide($("#loginbox"))
				show($("#scanbox"))

				$("#barcode").focus()
			}).catch((error) => {
				show($("#loginerror"))
				$("#userid").value = "" //Clear userid for touchless retry
				console.error("Failed to login")
				console.error(error)
			}).finally(function () {
				$("#userid").disabled = false
				hide($("#myModal"))
			})
	}
}

function loaduser(data) {
	alert(data);
}

function loan() {
	let barcode = $("#barcode").value
	if ((barcode != null) && (barcode != "")) {
		if (barcode == user.user_identifier[0].value || barcode == user.primary_id) {
			console.log("Re-scanned userid, logging out")
			logout();
			return
		}
		console.log($("#barcode").value)
		$("#modalheader").textContent = "Processing request, please wait..."
		hide($("#modalclosex"))
		show($("#myModal"))
		$("#barcode").disabled = true

		fetch(baseURL + "/users/" + user.primary_id + "/loans?item_barcode=" + $("#barcode").value, {
			method: "POST",
		}).then(r => r.json())
			.then((data) => {
				let dueDate = new Date(data.due_date)
				let dueDateText = (parseInt(dueDate.getMonth()) + 1) + "/" + dueDate.getDate() + "/" + dueDate.getFullYear();
				$("#loanstable tbody").innerHTML = $("#loanstable tbody").innerHTML + "<tr><td>" + data.title + "</td><td>" + dueDateText + "</td></tr>"
				returnToBarcode()
			}).catch((error) => {
				console.error("Failed to scan")
				console.error(error)
				$("#modalheader").textContent = "Item not available for loan.<br/><br/>Please see the circulation desk for more information.<br/><br/><input class='modalclosemain' type='button' value='close [6]' id='barcodeerrorbutton' onclick='javascript:returnToBarcode();'/>"
				$("#barcodeerrorbutton").focus()
				show($("#modalclosex"))
				$("#barcode").value = ""
				modalTimeout()
			}).finally(() => {
				extendTimeout()
			})
	}
}

function modalTimeout() {
	let timer = 5
	let timeout = setInterval(() => {
		let seconds = parseInt(timer % 60, 10)
		$("#barcodeerrorbutton").value = `close [${timer}]`

		if (--timer < 0) {
			// $(".close").hide()
			hide($("#myModal"))
			returnToBarcode();
			clearInterval(timeout);
		}
	}, 1000)
}

function sessionTimeout(duration, display) {
	sessiontimer = duration;
	let timeout = setInterval(function () {
		let minutes = parseInt(sessiontimer / 60, 10)
		let seconds = parseInt(sessiontimer % 60, 10)

		minutes = minutes < 10 ? "0" + minutes : minutes
		seconds = seconds < 10 ? "0" + seconds : seconds

		if (sessiontimer == null) {
			clearInterval(timeout)
		}

		if (sessiontimer != null && --sessiontimer < 0) {
			// sessiontimer = duration;
			console.log("sessiontimer is below zero, calling logout and clearInterval");
			logout();
			clearInterval(timeout);
		}

		if (sessiontimer >= 0) {
			// console.log(sessiontimer)
			display.textContent = minutes + ":" + seconds;
		}

	}, 1000)
}

function extendTimeout() {
	sessiontimer = defaultTimeout
}

function logout() {
	sessiontimer = null
	user = {}
	show($("#loginbox"))
	$("#userid").focus()

	hide($("#scanbox"))
	$("#scanboxtitle").textContent = ""
	$("#userloans").textContent = ""
	$("#userrequests").textContent = ""
	$("#userfees").textContent = ""
	$("#barcode").value = ""
	$("#userid").value = ""
}

document.addEventListener("DOMContentLoaded", (e) => {
	console.log($)
	$("#userid").focus()
})