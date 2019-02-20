---
id: KofNMultisig
title: KofNMultisig
---

<div class="contract-doc">
    <div class="contract"><h2 class="contract-header"><span class="contract-kind">contract</span> KofNMultisig</h2>
        <p class="description">Shared wallet of <code>N</code> people which requests the approval of <code>K</code> members for making a payment. If a member is inactive, another member of the group can send him a challenge which costs <code>penalty</code> ether. If the challenged user has not responded in <code>BLOCKS_TO_RESPOND</code> blocks, then he can be removed from group. In case of response, the user will stay in the group, <code>penalty</code> ether will be charged from the shared wallet and the challenge sender will have to wait <code>BLOCKS_TO_BLOCK</code> blocks before he can send a new challenge.</p>
        <p class="description"><code>penalty</code> is calculated dynamically by the following rule : <code>balance/N</code>, where <code>balance</code> is the amount in the shared wallet and <code>N</code> is the current number of members in group.</p>
        <div class="source"><b>Source:</b> <a href="https://github.com/davidstrouk/Ethereum-K-of-N-Multisig/blob/master/contracts/KofNMultisig.sol" target="_blank">KofNMultisig.sol</a></div>
        <div class="author"><b>Author:</b> Shoval Loolian, David Strouk</div>
    </div>
    <div class="index"><h2>Index</h2>
        <ul>
            <li><a href="KofNMultisig.html#constructor">constructor</a></li>
            <li><a href="KofNMultisig.html#approvePayment">approvePayment</a></li>
            <li><a href="KofNMultisig.html#requestPayment">requestPayment</a></li>
            <li><a href="KofNMultisig.html#respondToChallenge">respondToChallenge</a></li>
            <li><a href="KofNMultisig.html#sendChallenge">sendChallenge</a></li>
            <li><a href="KofNMultisig.html#tryToRemoveChallengedUser">tryToRemoveChallengedUser</a></li>
            <li><a href="KofNMultisig.html#fallback">fallback</a></li>
        </ul>
    </div>
    <div class="reference"><h2>Reference</h2>
        <div class="functions"><h3>Functions</h3>
            <ul>
                <li>
                    <div class="item function"><span id="constructor" class="anchor-marker"></span><h4 class="name">constructor</h4>
                        <div class="body"><code class="signature"><strong>constructor</strong><span>(address[] wallets, uint K) </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Initialize K-of-N-Multisig contract with N users and K approvals.</p>
                            </div>
                            <dl><dt><span class="label-parameters">Parameters:</span></dt>
                                <dd>
                                    <div><code>wallets</code> - The wallets addresses of the N users</div>
                                    <div><code>K</code> - The size of required approvals</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="approvePayment" class="anchor-marker"></span><h4 class="name">approvePayment</h4>
                        <div class="body"><code class="signature">function <strong>approvePayment</strong><span>(uint txId) </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Give user&#x27;s approval to transfer a payment requested by the <code>requestPayment</code> function.</p>
                                <p>When reaching K approvals for transaction <code>txId</code>, check if balance of shared wallet is enough to make the transfer.</p>
                                <p>Minimum balance to allow the transfer is calculated according to the following condition: if a challenge is active, balance should be at least <code>amount_to_transfer + penalty</code>, else only <code>amount_to_transfer</code>.</p>
                                <p>There is no retroactively verification of the approval's number, hence removal of a user from the group cannot influence confirmation of previous transactions.</p>
                            </div>
                            <dl><dt><span class="label-parameters">Parameters:</span></dt>
                                <dd>
                                    <div><code>txId</code> - The id of the transaction which the user is willing to give approval</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="requestPayment" class="anchor-marker"></span><h4 class="name">requestPayment</h4>
                        <div class="body"><code class="signature">function <strong>requestPayment</strong><span>(uint amount, address receiver) </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Request to transfer a certain amount from the shared wallet to address <code>receiver</code>.</p>
                                <p>Transfer will be allowed only when reached K confirmations from users in group by calling <code>approvePayment</code> function.</p>
                                <p>The user which requests the payment automatically approves it, hence he does not have to call <code>approvePayment</code> function.</p>
                                <p>
                            </div>
                            <dl><dt><span class="label-parameters">Parameters:</span></dt>
                                <dd>
                                    <div><code>amount</code> - The requested amount of Wei to transfer</div>
                                    <div><code>receiver</code> - The destination address of the payment</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="respondToChallenge" class="anchor-marker"></span><h4 class="name">respondToChallenge</h4>
                        <div class="body"><code class="signature">function <strong>respondToChallenge</strong><span>() </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Respond to the challenge published by <code>sendChallenge</code>. If the challenged user has responded in less than <code>BLOCKS_TO_RESPOND</code> blocks, collect from shared wallet an amount of <code>penalty</code> ether.</p>
                            </div>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="sendChallenge" class="anchor-marker"></span><h4 class="name">sendChallenge</h4>
                        <div class="body"><code class="signature">function <strong>sendChallenge</strong><span>(address target) </span><span>public </span><span>payable </span></code>
                            <hr />
                            <div class="description">
                                <p>Sends a challenge to a member of the group (<code>target</code>) to check whether its belonging to the group is still relevant. Along with calling this function user has to send <code>penalty</code> ether, calculated as mentioned before.</p>
                            </div>
                            <dl><dt><span class="label-parameters">Parameters:</span></dt>
                                <dd>
                                    <div><code>target</code> - The wallet address of the challenged user</div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="tryToRemoveChallengedUser" class="anchor-marker"></span><h4 class="name">tryToRemoveChallengedUser</h4>
                        <div class="body"><code class="signature">function <strong>tryToRemoveChallengedUser</strong><span>() </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Try to remove the challenged user. If the challenged user has not answered after <code>BLOCKS_TO_RESPOND</code> blocks, then he will be removed from group. Calling this function in less <code>BLOCKS_TO_RESPOND</code> blocks since challenge sending will do nothing.</p>
                            </div>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="fallback" class="anchor-marker"></span><h4 class="name">fallback</h4>
                        <div class="body"><code class="signature">function <strong></strong><span>() </span><span>external </span><span>payable </span></code>
                            <hr />
                            <div class="description">
                                <p>Send any amount of ether to the shared wallet.</p>
                            </div>
                        </div>
                    </div>
                </li>
            </ul>
        </div>
    </div>
</div>
