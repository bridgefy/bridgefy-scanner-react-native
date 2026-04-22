//
//  BeaconMeshManager.swift
//  BeaconMeshSDK
//
//  Created by Gilberto Julián De La Orta Hernandez on 19/04/26.
//

import Foundation
import BeaconMesh

@objcMembers
public final class BeaconMeshManager: NSObject {

    public static let shared = BeaconMeshManager()

    private var client: BeaconMeshClient?
    private let queue = DispatchQueue(label: "BeaconMeshManager.queue")

    private(set) var isInitialized = false
    private(set) var isStarted = false

    private override init() {
        super.init()
    }

    // MARK: - Errors

    private func makeError(_ message: String, code: Int) -> NSError {
        NSError(domain: "BeaconMeshManager", code: code, userInfo: [
            NSLocalizedDescriptionKey: message
        ])
    }

    // MARK: - Initialize

    public func initialize(
        apiKey: String,
        delegate: BeaconMeshClientDelegate,
        completion: @escaping (NSError?) -> Void
    ) {
        queue.async {
            do {
                guard UUID(uuidString: apiKey) != nil else {
                    throw self.makeError("Invalid API Key format", code: 100)
                }

                if self.client == nil {
                    self.client = try BeaconMeshClient(apiKey: apiKey)
                }

                self.client?.delegate = delegate
                self.isInitialized = true

                DispatchQueue.main.async { completion(nil) }
            } catch {
                DispatchQueue.main.async { completion(error as NSError) }
            }
        }
    }

    // MARK: - Start

    public func start(
        userId: String?,
        completion: @escaping (NSError?) -> Void
    ) {
        queue.async {
            guard let client = self.client else {
                DispatchQueue.main.async {
                    completion(self.makeError("Client not initialized", code: 101))
                }
                return
            }

            let uuid = userId.flatMap { UUID(uuidString: $0) }

            Task {
                do {
                    try await client.start(userId: uuid)
                    self.isStarted = true
                    DispatchQueue.main.async { completion(nil) }
                } catch {
                    DispatchQueue.main.async { completion(error as NSError) }
                }
            }
        }
    }

    public func stop() {
        queue.async {
            self.client?.stop()
            self.isStarted = false
        }
    }

    public func resetSession() {
        queue.async {
            self.client?.resetSession()
        }
    }

    public func currentUUID() -> String? {
        queue.sync {
            client?.currentUUID?.uuidString
        }
    }

    // MARK: - Messaging

    public func sendBroadcast(_ data: Data, err: NSErrorPointer) -> String? {
        guard let client = client else {
            err?.pointee = makeError("Client not initialized", code: 102)
            return nil
        }

        do {
            return try client.sendBroadcastMessage(data).uuidString
        } catch {
            err?.pointee = error as NSError
            return nil
        }
    }

    public func sendP2PMessage(
        _ data: Data,
        userId: UUID,
        err: NSErrorPointer
    ) -> String? {
        guard let client = client else {
            err?.pointee = makeError("Client not initialized", code: 103)
            return nil
        }

        do {
            return try client.sendP2PMessage(data, to: userId).uuidString
        } catch {
            err?.pointee = error as NSError
            return nil
        }
    }

    // MARK: - Nodes

    public func getConnectedNodes(err: NSErrorPointer) -> [[String: Any]]? {
        guard let nodes = client?.connectedNodes else {
            err?.pointee = makeError("Client not initialized", code: 104)
            return nil
        }

        let now = Date().timeIntervalSince1970 * 1000

        return nodes.map {
            [
                "id": $0.uuidString,
                "lastSeen": now
            ]
        }
    }

    public func getNode(nodeId: String, err: NSErrorPointer) -> [String: Any]? {
        guard let uuid = UUID(uuidString: nodeId) else {
            err?.pointee = makeError("Invalid UUID", code: 105)
            return nil
        }

        guard let client = client else {
            err?.pointee = makeError("Client not initialized", code: 106)
            return nil
        }

        return [
            "id": uuid.uuidString,
            "lastSeen": Date().timeIntervalSince1970,
            "connected": client.isNodeConnected(uuid)
        ]
    }
}
