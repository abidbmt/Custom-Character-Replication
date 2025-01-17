--!strict
--!native
--!optimize 2
--!nolint LocalShadow
--#selene: allow(shadowing)
-- File generated by Blink v0.15.1 (https://github.com/1Axen/Blink)
-- This file is not meant to be edited

local ReplicatedStorage = game:GetService("ReplicatedStorage")
local RunService = game:GetService("RunService")

local Invocations = 0

local SendSize = 64
local SendOffset = 0
local SendCursor = 0
local SendBuffer = buffer.create(64)
local SendInstances = {}

local RecieveCursor = 0
local RecieveBuffer = buffer.create(64)

local RecieveInstances = {}
local RecieveInstanceCursor = 0

type Entry = {
    value: any,
    next: Entry?
}

type Queue = {
    head: Entry?,
    tail: Entry?
}

type BufferSave = {
    Size: number, 
    Cursor: number, 
    Buffer: buffer, 
    Instances: {Instance}
}

local function Read(Bytes: number)
    local Offset = RecieveCursor
    RecieveCursor += Bytes
    return Offset
end

local function Save(): BufferSave
    return {
        Size = SendSize,
        Cursor = SendCursor,
        Buffer = SendBuffer,
        Instances = SendInstances
    }
end

local function Load(Save: BufferSave?)
    if Save then
        SendSize = Save.Size
        SendCursor = Save.Cursor
        SendOffset = Save.Cursor
        SendBuffer = Save.Buffer
        SendInstances = Save.Instances
        return
    end

    SendSize = 64
    SendCursor = 0
    SendOffset = 0
    SendBuffer = buffer.create(64)
    SendInstances = {}
end

local function Invoke()
    if Invocations == 255 then
        Invocations = 0
    end

    local Invocation = Invocations
    Invocations += 1
    return Invocation
end

local function Allocate(Bytes: number)
    local InUse = (SendCursor + Bytes)
    if InUse > SendSize then
        --> Avoid resizing the buffer for every write
        while InUse > SendSize do
            SendSize *= 1.5
        end

        local Buffer = buffer.create(SendSize)
        buffer.copy(Buffer, 0, SendBuffer, 0, SendCursor)
        SendBuffer = Buffer
    end

    SendOffset = SendCursor
    SendCursor += Bytes
    
    return SendOffset
end

local function CreateQueue(): Queue
    return {
        head = nil,
        tail = nil
    }
end

local function Pop(queue: Queue): any
    local head = queue.head
    if head == nil then
        return
    end

    queue.head = head.next
    return head.value
end

local function Push(queue: Queue, value: any)
    local entry: Entry = {
        value = value,
        next = nil
    }

    if queue.tail ~= nil then
        queue.tail.next = entry
    end

    queue.tail = entry

    if queue.head == nil then
        queue.head = entry
    end
end

local Calls = table.create(256)

local Events: any = {
    Reliable = table.create(256),
    Unreliable = table.create(256)
}

local Queue: any = {
    Reliable = table.create(256),
    Unreliable = table.create(256)
}

Events.Unreliable[1] = {}
Queue.Unreliable[1] = table.create(256)
local function WriteEVENT_ReadyPacket(Value: nil): ()
	-- Allocate BLOCK: 1 bytes
	local BLOCK_START = Allocate(1)
	buffer.writeu8(SendBuffer, BLOCK_START + 0, 0)
end

local function WriteEVENT_ClientToServer(Value: { cframe: CFrame, deltaTime: number }): ()
	-- Allocate BLOCK: 29 bytes
	local BLOCK_START = Allocate(29)
	buffer.writeu8(SendBuffer, BLOCK_START + 0, 0)
	local Vector = Value.cframe.Position
	buffer.writef32(SendBuffer, BLOCK_START + 1, Vector.X)
	buffer.writef32(SendBuffer, BLOCK_START + 5, Vector.Y)
	buffer.writef32(SendBuffer, BLOCK_START + 9, Vector.Z)
	local rX, rY, rZ = Value.cframe:ToOrientation()
	buffer.writef32(SendBuffer, BLOCK_START + 13, rX)
	buffer.writef32(SendBuffer, BLOCK_START + 17, rY)
	buffer.writef32(SendBuffer, BLOCK_START + 21, rZ)
	buffer.writef32(SendBuffer, BLOCK_START + 25, Value.deltaTime)
end

local function ReadEVENT_ServerToClient(): ({ player: Player, cframe: CFrame, deltaTime: number })
	-- Read BLOCK: 28 bytes
	local BLOCK_START = Read(28)
	local Value = {} :: any
	RecieveInstanceCursor += 1
	Value.player = RecieveInstances[RecieveInstanceCursor]
	if (not Value.player) or typeof(Value.player) ~= "Instance" then error(`Expected an Instance, got {typeof(Value.player)} instead.`) end
	if not Value.player:IsA("Player") then error(`Expected an Instance of type "Player", got "{Value.player.ClassName}" instead.`) end
	local X = buffer.readf32(RecieveBuffer, BLOCK_START + 0)
	local Y = buffer.readf32(RecieveBuffer, BLOCK_START + 4)
	local Z = buffer.readf32(RecieveBuffer, BLOCK_START + 8)
	local Position = Vector3.new(X, Y, Z)
	local rX = buffer.readf32(RecieveBuffer, BLOCK_START + 12)
	local rY = buffer.readf32(RecieveBuffer, BLOCK_START + 16)
	local rZ = buffer.readf32(RecieveBuffer, BLOCK_START + 20)
	Value.cframe = CFrame.new(Position) * CFrame.fromOrientation(rX, rY, rZ)
	Value.deltaTime = buffer.readf32(RecieveBuffer, BLOCK_START + 24)
	return Value
end

if not RunService:IsRunning() then
	local NOOP = function() end
	local Returns = table.freeze({
	ReadyPacket = {
		Fire = NOOP
	},
	ClientToServer = {
		Fire = NOOP
	},
	ServerToClient = {
		On = NOOP
	},
	})
	return Returns :: BLINK_EVENTS_SYMBOL
end

if not RunService:IsClient() then
    error("Client network module can only be required from the client.")
end

local Reliable: RemoteEvent = ReplicatedStorage:WaitForChild("BLINK_RELIABLE_REMOTE") :: RemoteEvent
local Unreliable: UnreliableRemoteEvent = ReplicatedStorage:WaitForChild("BLINK_UNRELIABLE_REMOTE") :: UnreliableRemoteEvent

local function StepReplication()
    if SendCursor <= 0 then
        return
    end

    local Buffer = buffer.create(SendCursor)
    buffer.copy(Buffer, 0, SendBuffer, 0, SendCursor)
    Reliable:FireServer(Buffer, SendInstances)

    SendSize = 64
    SendCursor = 0
    SendOffset = 0
    SendBuffer = buffer.create(64)
    table.clear(SendInstances)
end
local Elapsed = 0
RunService.Heartbeat:Connect(function(DeltaTime: number)
	Elapsed += DeltaTime
	if Elapsed >= (1 / 61) then
		Elapsed -= (1 / 61)
		StepReplication()
	end
end)
Reliable.OnClientEvent:Connect(function(Buffer: buffer, Instances: {Instance})
	RecieveCursor = 0
	RecieveBuffer = Buffer
	RecieveInstances = Instances
	RecieveInstanceCursor = 0
	local Size = buffer.len(RecieveBuffer)
	while (RecieveCursor < Size) do
		-- Read BLOCK: 1 bytes
		local BLOCK_START = Read(1)
		local Index = buffer.readu8(RecieveBuffer, BLOCK_START + 0)
	end
end)
Unreliable.OnClientEvent:Connect(function(Buffer: buffer, Instances: {Instance})
	RecieveCursor = 0
	RecieveBuffer = Buffer
	RecieveInstances = Instances
	RecieveInstanceCursor = 0
	local Size = buffer.len(RecieveBuffer)
	while (RecieveCursor < Size) do
		-- Read BLOCK: 1 bytes
		local BLOCK_START = Read(1)
		local Index = buffer.readu8(RecieveBuffer, BLOCK_START + 0)
		if Index == 1 then
			local Value: { player: Player, cframe: CFrame, deltaTime: number } = ReadEVENT_ServerToClient()
			if Events.Unreliable[1] ~= nil then
				for _, Listener in Events.Unreliable[1] do
					task.spawn(Listener, Value)
				end
			end
		end
	end
end)


local Returns = table.freeze({
	StepReplication = StepReplication,

	ReadyPacket = {
		Fire = function(Value: nil): ()
			WriteEVENT_ReadyPacket(Value)
		end
	},
	ClientToServer = {
		Fire = function(Value: { cframe: CFrame, deltaTime: number }): ()
			local Previous = Save()
			Load()
			WriteEVENT_ClientToServer(Value)
			local Buffer = buffer.create(SendCursor)
			buffer.copy(Buffer, 0, SendBuffer, 0, SendCursor)
			Unreliable:FireServer(Buffer, SendInstances)
			Load(Previous)
		end
	},
	ServerToClient = {
		On = function(Listener: (Value: { player: Player, cframe: CFrame, deltaTime: number }) -> ()): () -> ()
			table.insert(Events.Unreliable[1], Listener)
			return function (): ()
				table.remove(Events.Unreliable[1], table.find(Events.Unreliable[1], Listener))
			end
		end
	},
})
type BLINK_EVENTS_SYMBOL = typeof(Returns)
return Returns :: BLINK_EVENTS_SYMBOL