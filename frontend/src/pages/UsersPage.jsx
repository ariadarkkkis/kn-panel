import React, { useState } from 'react'

import UsageStats from '../components/UsageStats'
import UsersTable from '../components/UsersTable'
import Button from '../components/Button'
import CreateUserForm from '../components/CreateUserForm'
import Search from '../components/Search'
import { AnimatePresence } from 'framer-motion'
import { ReactComponent as RefreshIcon } from '../assets/refresh.svg'
import './UsersPage.css'

let users = [
    {
        id: 1,
        username: "soheil17",
        isActive: true,
        expireTime: {
            days: 24,
            hours: 24,
            minutes: 32
        },
        dataUsage: 350766210,
        totalData: 2008976720,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 2,
        username: "soheil18",
        isActive: false,
        expireTime: {
            days: 15,
            hours: 12,
            minutes: 42
        },
        dataUsage: 1024785,
        totalData: 2006753,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 3,
        username: "soheil19",
        isActive: true,
        expireTime: {
            days: 0,
            hours: 12,
            minutes: 19
        },
        dataUsage: 2056431,
        totalData: 2056431,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 4,
        username: "soheil17",
        isActive: true,
        expireTime: {
            days: 24,
            hours: 24,
            minutes: 32
        },
        dataUsage: 350766210,
        totalData: 2008976720,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 5,
        username: "soheil18",
        isActive: false,
        expireTime: {
            days: 15,
            hours: 12,
            minutes: 42
        },
        dataUsage: 1024785,
        totalData: 2006753,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 6,
        username: "soheil19",
        isActive: true,
        expireTime: {
            days: 0,
            hours: 12,
            minutes: 19
        },
        dataUsage: 2056431,
        totalData: 2056431,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 7,
        username: "soheil17",
        isActive: true,
        expireTime: {
            days: 24,
            hours: 24,
            minutes: 32
        },
        dataUsage: 350766210,
        totalData: 2008976720,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 8,
        username: "soheil18",
        isActive: false,
        expireTime: {
            days: 15,
            hours: 12,
            minutes: 42
        },
        dataUsage: 1024785,
        totalData: 2006753,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 9,
        username: "soheil19",
        isActive: true,
        expireTime: {
            days: 0,
            hours: 12,
            minutes: 19
        },
        dataUsage: 2056431,
        totalData: 2056431,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 10,
        username: "soheil17",
        isActive: true,
        expireTime: {
            days: 24,
            hours: 24,
            minutes: 32
        },
        dataUsage: 350766210,
        totalData: 2008976720,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 11,
        username: "soheil18",
        isActive: false,
        expireTime: {
            days: 15,
            hours: 12,
            minutes: 42
        },
        dataUsage: 1024785,
        totalData: 2006753,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 12,
        username: "soheil19",
        isActive: true,
        expireTime: {
            days: 0,
            hours: 12,
            minutes: 19
        },
        dataUsage: 2056431,
        totalData: 2056431,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 13,
        username: "soheil17",
        isActive: true,
        expireTime: {
            days: 24,
            hours: 24,
            minutes: 32
        },
        dataUsage: 350766210,
        totalData: 2008976720,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 14,
        username: "soheil18",
        isActive: false,
        expireTime: {
            days: 15,
            hours: 12,
            minutes: 42
        },
        dataUsage: 1024785,
        totalData: 2006753,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 15,
        username: "soheil19",
        isActive: true,
        expireTime: {
            days: 0,
            hours: 12,
            minutes: 19
        },
        dataUsage: 2056431,
        totalData: 2056431,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 16,
        username: "soheil17",
        isActive: true,
        expireTime: {
            days: 24,
            hours: 24,
            minutes: 32
        },
        dataUsage: 350766210,
        totalData: 2008976720,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 17,
        username: "soheil18",
        isActive: false,
        expireTime: {
            days: 15,
            hours: 12,
            minutes: 42
        },
        dataUsage: 1024785,
        totalData: 2006753,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
    {
        id: 18,
        username: "soheil19",
        isActive: true,
        expireTime: {
            days: 0,
            hours: 12,
            minutes: 19
        },
        dataUsage: 2056431,
        totalData: 2056431,
        subscriptionLink: "https://www.google.com",
        config: "loreamasndlasdobobllb32o39232o2b39g9gib21neo1hn//a/sd/454/"
    },
]

const UsersPage = () => {
    const [showModal, setShowModal] = useState(false)

    const handleClick = () => {
        setShowModal(true)
    }

    const handleClose = () => {
        setShowModal(false)
    }

    return (
        <div>
            <UsageStats activeUsers={10} totalUsers={549} dataUsage="1 GB" remainingData="198 GB" allocableData="1 TB" />
            <div className="container flex items-center justify-between   column-reverse items-end gap-16">
                <Search />
                <span style={{ display: "flex", gap: "0.5rem" }} className='items-center'>
                    <Button className="transparent refresh"><RefreshIcon /></Button>
                    <Button onClick={handleClick} className="create-user-button primary">Create User</Button>
                </span>
            </div>
            <AnimatePresence>
                {showModal && <CreateUserForm
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    handleClose={handleClose}
                />}
            </AnimatePresence>
            <UsersTable users={users} rowsPerPage={5} />
        </div>
    )
}

export default UsersPage