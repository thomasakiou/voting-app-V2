import React from 'react';
import { Link } from 'react-router-dom';

export const PrivacyPolicy: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 mb-6 transition-colors group"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Login
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8 md:p-12">
                    <div className="mb-8">
                        <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined text-3xl">privacy_tip</span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Privacy Policy</h1>
                        <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Introduction</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Welcome to SecureVote. We are committed to protecting your personal information and your right to privacy.
                                This Privacy Policy explains how we collect, use, disclose, and safeguard your information when you use our
                                online voting platform.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Information We Collect</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                We collect information that you provide directly to us, including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
                                <li><strong>Personal Information:</strong> Username, full name, phone number</li>
                                <li><strong>Authentication Data:</strong> Password (encrypted), login timestamps</li>
                                <li><strong>Voting Records:</strong> Your vote choices (anonymized and encrypted)</li>
                                <li><strong>Technical Data:</strong> IP address, browser type, device information</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. How We Use Your Information</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                We use the information we collect to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
                                <li>Verify your identity and eligibility to vote</li>
                                <li>Process and record your votes securely</li>
                                <li>Prevent fraud and ensure election integrity</li>
                                <li>Communicate important election-related information</li>
                                <li>Improve our platform's security and functionality</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Vote Privacy & Anonymity</h2>
                            <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-xl p-6 mb-4">
                                <p className="text-indigo-900 dark:text-indigo-200 font-semibold mb-2">
                                    🔒 Your Vote is Secret
                                </p>
                                <p className="text-indigo-800 dark:text-indigo-300 text-sm">
                                    We employ cryptographic techniques to ensure that your vote cannot be traced back to you.
                                    Once cast, your ballot is anonymized and stored separately from your identity information.
                                </p>
                            </div>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Data Security</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We implement industry-standard security measures including:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4 mt-3">
                                <li>End-to-end encryption for all data transmission</li>
                                <li>Secure password hashing using bcrypt</li>
                                <li>Regular security audits and penetration testing</li>
                                <li>Access controls and authentication mechanisms</li>
                                <li>Encrypted database storage</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. Data Retention</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We retain your personal information only for as long as necessary to fulfill the purposes outlined in this
                                Privacy Policy. Voting records are retained in accordance with electoral regulations and legal requirements.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Your Rights</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                You have the right to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
                                <li>Access your personal information</li>
                                <li>Request correction of inaccurate data</li>
                                <li>Request deletion of your data (subject to legal requirements)</li>
                                <li>Opt-out of non-essential communications</li>
                                <li>Lodge a complaint with relevant data protection authorities</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Third-Party Disclosure</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We do not sell, trade, or otherwise transfer your personal information to third parties without your consent,
                                except as required by law or to protect the integrity of the electoral process.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Changes to This Policy</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new
                                Privacy Policy on this page and updating the "Last updated" date.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Contact Us</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                If you have questions or concerns about this Privacy Policy, please contact us at:
                            </p>
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>Email:</strong> privacy@securevote.com<br />
                                    <strong>Address:</strong> SecureVote Electoral Commission<br />
                                    <strong>Phone:</strong> +1 (555) 123-4567
                                </p>
                            </div>
                        </section>
                    </div>
                </div>
            </div>
        </div>
    );
};

export const TermsOfService: React.FC = () => {
    return (
        <div className="min-h-screen bg-slate-50 dark:bg-[#0B1120] py-12 px-4">
            <div className="max-w-4xl mx-auto">
                <div className="mb-8">
                    <Link
                        to="/login"
                        className="inline-flex items-center gap-2 text-sm font-medium text-indigo-600 hover:text-indigo-500 dark:text-indigo-400 mb-6 transition-colors group"
                    >
                        <span className="material-symbols-outlined text-sm group-hover:-translate-x-1 transition-transform">arrow_back</span>
                        Back to Login
                    </Link>
                </div>

                <div className="bg-white dark:bg-slate-800 rounded-3xl shadow-xl border border-slate-100 dark:border-slate-700/50 p-8 md:p-12">
                    <div className="mb-8">
                        <div className="size-16 rounded-2xl bg-indigo-50 dark:bg-indigo-500/10 flex items-center justify-center mb-4 text-indigo-600 dark:text-indigo-400">
                            <span className="material-symbols-outlined text-3xl">gavel</span>
                        </div>
                        <h1 className="text-4xl font-bold text-slate-900 dark:text-white mb-2">Terms of Service</h1>
                        <p className="text-slate-500 dark:text-slate-400">Last updated: {new Date().toLocaleDateString()}</p>
                    </div>

                    <div className="prose prose-slate dark:prose-invert max-w-none space-y-6">
                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">1. Acceptance of Terms</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                By accessing and using the SecureVote platform, you accept and agree to be bound by the terms and provisions
                                of this agreement. If you do not agree to these terms, please do not use this service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">2. Eligibility</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                To use this voting platform, you must:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
                                <li>Be a registered voter in the applicable jurisdiction</li>
                                <li>Have received valid login credentials from election administrators</li>
                                <li>Be of legal voting age as defined by applicable laws</li>
                                <li>Not be disqualified from voting under any applicable law</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">3. User Responsibilities</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                As a user of this platform, you agree to:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
                                <li>Maintain the confidentiality of your login credentials</li>
                                <li>Not share your account with any other person</li>
                                <li>Cast only one vote per contest (duplicate voting is prohibited)</li>
                                <li>Not attempt to manipulate, interfere with, or disrupt the voting process</li>
                                <li>Report any security vulnerabilities or suspicious activity immediately</li>
                                <li>Comply with all applicable electoral laws and regulations</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">4. Voting Process</h2>
                            <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-6 mb-4">
                                <p className="text-amber-900 dark:text-amber-200 font-semibold mb-2">
                                    ⚠️ Important Notice
                                </p>
                                <p className="text-amber-800 dark:text-amber-300 text-sm">
                                    Once you cast your vote, it cannot be changed or withdrawn. Please review your selections carefully
                                    before final submission.
                                </p>
                            </div>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                The voting process is designed to be secure, anonymous, and tamper-proof. Your vote is encrypted and
                                anonymized upon submission to ensure ballot secrecy while maintaining election integrity.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">5. Prohibited Activities</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
                                You are expressly prohibited from:
                            </p>
                            <ul className="list-disc list-inside space-y-2 text-slate-600 dark:text-slate-300 ml-4">
                                <li>Attempting to vote on behalf of another person</li>
                                <li>Hacking, reverse engineering, or attempting to breach system security</li>
                                <li>Using automated tools or bots to interact with the platform</li>
                                <li>Interfering with other users' ability to vote</li>
                                <li>Distributing malware or engaging in any malicious activity</li>
                                <li>Attempting to manipulate vote counts or election results</li>
                            </ul>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">6. System Availability</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                While we strive to maintain 100% uptime during voting periods, we do not guarantee uninterrupted access
                                to the platform. Scheduled maintenance will be communicated in advance. We are not liable for any inability
                                to vote due to technical issues beyond our reasonable control.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">7. Intellectual Property</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                All content, features, and functionality of the SecureVote platform, including but not limited to text,
                                graphics, logos, and software, are the exclusive property of SecureVote and are protected by copyright,
                                trademark, and other intellectual property laws.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">8. Limitation of Liability</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                To the fullest extent permitted by law, SecureVote shall not be liable for any indirect, incidental,
                                special, consequential, or punitive damages arising out of or related to your use of the platform.
                                Our total liability shall not exceed the amount paid by you (if any) to access the service.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">9. Dispute Resolution</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                Any disputes arising from these Terms of Service shall be resolved through binding arbitration in accordance
                                with the rules of the applicable electoral commission. You waive any right to participate in class action lawsuits.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">10. Termination</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We reserve the right to suspend or terminate your access to the platform at any time, without notice,
                                for conduct that we believe violates these Terms of Service or is harmful to other users, us, or third parties.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">11. Changes to Terms</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                We reserve the right to modify these terms at any time. Changes will be effective immediately upon posting.
                                Your continued use of the platform after changes constitutes acceptance of the modified terms.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">12. Governing Law</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                These Terms of Service shall be governed by and construed in accordance with the laws of the jurisdiction
                                in which the election is being conducted, without regard to conflict of law principles.
                            </p>
                        </section>

                        <section>
                            <h2 className="text-2xl font-bold text-slate-900 dark:text-white mb-4">13. Contact Information</h2>
                            <p className="text-slate-600 dark:text-slate-300 leading-relaxed">
                                For questions about these Terms of Service, please contact:
                            </p>
                            <div className="mt-4 p-4 bg-slate-50 dark:bg-slate-900/50 rounded-xl border border-slate-200 dark:border-slate-700">
                                <p className="text-slate-700 dark:text-slate-300">
                                    <strong>Email:</strong> legal@securevote.com<br />
                                    <strong>Address:</strong> SecureVote Electoral Commission<br />
                                    <strong>Phone:</strong> +1 (555) 123-4567
                                </p>
                            </div>
                        </section>

                        <div className="mt-8 pt-6 border-t border-slate-200 dark:border-slate-700">
                            <p className="text-sm text-slate-500 dark:text-slate-400 text-center">
                                By using SecureVote, you acknowledge that you have read, understood, and agree to be bound by these Terms of Service.
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
