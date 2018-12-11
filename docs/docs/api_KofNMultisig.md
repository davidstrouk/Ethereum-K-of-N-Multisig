---
id: KofNMultisig
title: KofNMultisig
---

<div class="contract-doc">
    <div class="contract"><h2 class="contract-header"><span class="contract-kind">contract</span> KofNMultisig</h2>
        <p class="description">Shared wallet of N people which requests the approval of K members for making a payment.</p>
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
                        <div class="body"><code class="signature">function <strong></strong><span>(address[] wallets, uint k) </span><span>public </span></code>
                            <hr />
                            <div class="description">
                                <p>Initialize KofNMultisig contract with N wallets and K approvals.</p>
                            </div>
                            <dl><dt><span class="label-parameters">Parameters:</span></dt>
                                <dd>
                                    <div><code>wallets</code> - The wallets addresses of the N users</div>
                                    <div><code>k</code> - The size of required approvals</div>
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
                                <p>Give user&#x27;s approval to send a requested payment.</p>
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
                                <p>Request to transfer a certain amount from the shared wallet to another address.</p>
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
                                <p>Respond to the published challenge. Collect from shared wallet an amount of penalty.</p>
                            </div>
                        </div>
                    </div>
                </li>
                <li>
                    <div class="item function"><span id="sendChallenge" class="anchor-marker"></span><h4 class="name">sendChallenge</h4>
                        <div class="body"><code class="signature">function <strong>sendChallenge</strong><span>(address target) </span><span>public </span><span>payable </span></code>
                            <hr />
                            <div class="description">
                                <p>Sends a challenge to a member of the group to check whether its belonging to the group is still relevant. Along with calling this function a fee is needed.</p>
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
                                <p>Try to remove the challenged user. If the challenged user has not answered after a certain amount of blocks (BLOCKS_TO_RESPOND), then he will be removed from group.</p>
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
