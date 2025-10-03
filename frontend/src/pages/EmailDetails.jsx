import Sidebar from "../components/Sidebar"
import Label from "../components/Label"
import { useParams } from "react-router-dom"
import axios from "axios"
import { backend } from "../server"
import { useState, useEffect } from "react"
import { Loader2, Mail } from "lucide-react"

function EmailDetails() {
    const { campaignId } = useParams()
    const [campaign, setCampaign] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const fetchCampaign = async () => {
            try {
                const res = await axios.get(`${backend}/emails/campaign/${campaignId}`, {
                    withCredentials: true,
                })
                setCampaign(res.data)
            } catch (err) {
                console.error("Error fetching campaign:", err)
            } finally {
                setLoading(false)
            }
        }
        fetchCampaign()
    }, [campaignId])

    if (loading) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <Loader2 className="animate-spin h-10 w-10 text-indigo-600" />
            </div>
        )
    }

    if (!campaign) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-gray-100">
                <p className="text-gray-600">Campaign not found</p>
            </div>
        )
    }

    return (
        <div className="flex min-h-screen bg-gray-100">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <Label />
                <div className="flex-1 overflow-y-auto px-8 py-10">
                    {/* Header */}
                    <div className="text-center mb-12">
                        <div className="flex justify-center mb-6">
                            <div className="w-16 h-16 bg-indigo-100 rounded-2xl flex items-center justify-center">
                                <Mail className="w-8 h-8 text-indigo-600" />
                            </div>
                        </div>
                        <h1 className="text-3xl font-light mb-2">{campaign.label}</h1>
                        <p className="text-lg text-gray-600">Campaign Details</p>
                    </div>

                    {/* Campaign info */}
                    <div className="bg-white border rounded-xl p-6 mb-8">
                        <h2 className="text-xl font-semibold mb-4">{campaign.subject}</h2>
                        <p className="text-gray-700 whitespace-pre-line mb-4">{campaign.body}</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
                            <p><span className="font-medium">From:</span> {campaign.from_name} &lt;{campaign.from_email}&gt;</p>
                            <p><span className="font-medium">Reply To:</span> {campaign.reply_to_email}</p>
                            <p><span className="font-medium">Status:</span> {campaign.status}</p>
                            <p><span className="font-medium">Send Type:</span> {campaign.send_type}</p>
                            <p><span className="font-medium">Created At:</span> {new Date(campaign.created_at).toLocaleString()}</p>
                            {campaign.scheduled_at && (
                                <p><span className="font-medium">Scheduled At:</span> {new Date(campaign.scheduled_at).toLocaleString()}</p>
                            )}
                        </div>
                    </div>

                    {/* Recipients */}
                    <div className="bg-white border rounded-xl p-6">
                        <h3 className="text-lg font-semibold mb-4">Recipients</h3>
                        {campaign.recipients.length === 0 ? (
                            <p className="text-gray-500 text-sm">No recipients</p>
                        ) : (
                            <table className="w-full border-collapse text-sm">
                                <thead>
                                    <tr className="border-b">
                                        <th className="text-left py-2">Name</th>
                                        <th className="text-left py-2">Email</th>
                                        <th className="text-left py-2">Status</th>
                                        <th className="text-left py-2">Sent At</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {campaign.recipients.map((r) => (
                                        <tr key={r.recipient_id} className="border-b">
                                            <td className="py-2">{r.first_name} {r.last_name}</td>
                                            <td className="py-2">{r.email}</td>
                                            <td className="py-2">{r.recipient_status}</td>
                                            <td className="py-2">{r.sent_at ? new Date(r.sent_at).toLocaleString() : "—"}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default EmailDetails
